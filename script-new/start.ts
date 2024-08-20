import { downloadConfigs } from './download.ts';
import { consola } from 'consola';
import { convert } from './convert.ts';
import { uploadAll } from './upload-to-wrt.ts';

consola.box(`start work`);

await downloadConfigs();

consola.success(`download done`);

consola.box(`convert to clash`);
await convert();
consola.success(`convert done`);

consola.box(`upload to wrt`);
await uploadAll();
consola.success(`upload done`);

consola.success(`all done`);
