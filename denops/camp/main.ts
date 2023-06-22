import { $, assert, Denops, fn, is, systemopen } from "./deps.ts";

export function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async campNew(name: unknown): Promise<void> {
      assert(name, is.String);
      await competeNew(name);
      for await (const src of $.fs.expandGlob(`${name}/src/bin/*.rs`)) {
        const path = src.path;
        await fn.bufadd(denops, path);
      }
    },
    async campOpen(): Promise<void> {
      await competeOpen(await currentFullPath(denops));
    },
    async campTest(): Promise<void> {
      const [_, output] = await competeTest(await currentFullPath(denops));
      await denops.call("camp#write", "test", output);
    },
    async campSubmit(force: unknown): Promise<void> {
      assert(force, is.Number);
      const source = await currentFullPath(denops);
      if (!force) {
        const [success, output] = await competeTest(source);
        if (!success) {
          await denops.call("camp#write", "test", output);
          return;
        }
        if (
          await fn.confirm(denops, "Submit?", "&Yes\n&No", 0, "Question") !== 1
        ) {
          denops.cmd('echo "canceled"');
          return;
        }
      }
      const uri = await competeSubmit(source);
      await systemopen(uri);
    },
  };
  return Promise.resolve();
}

async function currentFullPath(denops: Denops): Promise<string> {
  return await fn.expand(denops, "%:p") as string;
}

async function competeNew(name: string): Promise<void> {
  await $`cargo compete new ${name}`.noThrow().quiet();
}

async function competeOpen(source: string): Promise<void> {
  const { dir, name } = $.path.parse(source);
  await $`cargo compete open --bin ${name}`
    .cwd(dir)
    .noThrow()
    .quiet();
}

async function competeTest(source: string): Promise<[boolean, string[]]> {
  const { dir, name } = $.path.parse(source);
  const { code, combined } = await $`cargo compete test ${name}`
    .captureCombined()
    .cwd(dir)
    .noThrow()
    .spawn();
  return [code === 0, combined.split("\n")];
}

async function competeSubmit(source: string): Promise<string> {
  const { dir, name } = $.path.parse(source);
  const lines = await $`cargo compete submit ${name} --no-test --no-watch`
    .captureCombined()
    .cwd(dir)
    .noThrow()
    .lines();
  let uri = "";
  for (const line of lines) {
    if (line.includes("URL (detail)")) {
      uri = line.replace(/^.*(https\S+).*$/, "$1");
    }
  }
  return uri;
}
