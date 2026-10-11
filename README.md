# opencode-x

A minimal TypeScript plugin for OpenCode V2. The plugin does not change OpenCode behavior.
This project uses `@opencode/plugin` 2.0.26. It does not support OpenCode V1.

## Development

Install Node.js 22.13 or later and npm 11.16.0. Then run:

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Edit `src/index.ts`. Use `npm run dev` to build when files change.
The build writes only `dist/index.js` and `dist/index.d.ts`.

Use `npm run lint:fix` to fix lint errors. Use `npm run format` to format project files.
The build checks types with TypeScript 7.0.2 through the `@typescript/native` package alias.
The typecheck script selects this compiler directly because TypeScript 6 also supplies `tsc`.
tsup bundles local modules and generates type declarations. Node.js modules and
`@opencode/plugin` remain external.
ESLint and declaration generation use TypeScript 6 through the `typescript` package alias.
The `package-lock.json` file fixes the dependency versions for `npm ci`.

## Load in OpenCode

Build the plugin first. Add its directory to `plugins` in your target project's
`opencode.jsonc`. Keep existing entries.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/opencode-x"],
}
```

Replace `/absolute/path/opencode-x` with this repository's full path.
Use OpenCode 2.0.26. Restart the OpenCode service after a build if changes do not load:

```sh
opencode service restart
```

See the [OpenCode V2 plugin guide](https://opencode.ai/v2/docs/build/plugins).
