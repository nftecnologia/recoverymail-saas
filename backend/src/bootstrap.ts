import { register } from 'tsconfig-paths';
import * as path from 'path';

// Registrar os path mappings para produção
const baseUrl = path.join(__dirname);
const tsConfig = {
  baseUrl,
  paths: {
    '@/*': ['*'],
    '@config/*': ['config/*'],
    '@routes/*': ['routes/*'],
    '@handlers/*': ['handlers/*'],
    '@services/*': ['services/*'],
    '@utils/*': ['utils/*'],
    '@types/*': ['types/*']
  }
};

register({
  baseUrl: tsConfig.baseUrl,
  paths: tsConfig.paths
});

// Importar e iniciar o servidor
import('./server'); 