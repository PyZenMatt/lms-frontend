// Vite environment typings for the project (included in tsconfig.ui.json)
interface ImportMetaEnv {
  readonly VITE_RPC_URL_AMOY?: string;
  // add other VITE__* vars used in the project here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
