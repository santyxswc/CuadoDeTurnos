import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { ColeccionJson, RegistroJsonl } from './archivo-json';

interface Doc {
  id: string;
  n: number;
}

describe('almacén JSON (ADR-010)', () => {
  let dir: string;
  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sgt-almacen-'));
  });
  after(() => rm(dir, { recursive: true, force: true }));

  it('crea el archivo al primer cambio y lo vuelve a leer', async () => {
    const c = new ColeccionJson<Doc>(join(dir, 'docs.json'));
    await c.cargar();
    assert.deepEqual(c.todos(), []);
    await c.insertar({ id: 'a', n: 1 });
    const otra = new ColeccionJson<Doc>(join(dir, 'docs.json'));
    await otra.cargar();
    assert.deepEqual(otra.todos(), [{ id: 'a', n: 1 }]);
  });

  it('no pierde cambios con 100 escrituras concurrentes', async () => {
    const ruta = join(dir, 'contador.json');
    const c = new ColeccionJson<Doc>(ruta);
    await c.cargar();
    await c.insertar({ id: 'x', n: 0 });
    await Promise.all(Array.from({ length: 100 }, () => c.actualizar('x', (d) => ({ ...d, n: d.n + 1 }))));
    assert.equal(c.obtener('x')?.n, 100);
    assert.equal(JSON.parse(await readFile(ruta, 'utf8'))[0].n, 100);
    // No quedan archivos temporales.
    assert.ok(!(await readdir(dir)).some((f) => f.endsWith('.tmp')));
  });

  it('las copias devueltas no modifican la memoria', async () => {
    const c = new ColeccionJson<Doc>(join(dir, 'copias.json'));
    await c.cargar();
    await c.insertar({ id: 'a', n: 1 });
    c.obtener('a')!.n = 99;
    assert.equal(c.obtener('a')?.n, 1);
  });

  it('si el cambio falla, la memoria y el disco quedan como estaban', async () => {
    const c = new ColeccionJson<Doc>(join(dir, 'fallo.json'));
    await c.cargar();
    await c.insertar({ id: 'a', n: 1 });
    await assert.rejects(c.insertar({ id: 'a', n: 2 }));
    assert.deepEqual(c.todos(), [{ id: 'a', n: 1 }]);
    await c.insertar({ id: 'b', n: 2 }); // la cola sigue funcionando
    assert.equal(c.todos().length, 2);
  });

  it('un JSON dañado detiene la carga con un error claro en vez de borrarse', async () => {
    const ruta = join(dir, 'danado.json');
    await import('node:fs/promises').then((fs) => fs.writeFile(ruta, '{ no es json'));
    const c = new ColeccionJson<Doc>(ruta);
    await assert.rejects(c.cargar(), /No se pudo leer/);
  });

  it('el registro JSONL agrega y devuelve los últimos eventos', async () => {
    const r = new RegistroJsonl<{ i: number }>(join(dir, 'auditoria.jsonl'));
    await Promise.all([1, 2, 3].map((i) => r.agregar({ i })));
    assert.deepEqual((await r.ultimos(2)).map((e) => e.i), [3, 2]);
  });
});
