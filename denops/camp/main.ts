import { $, assert, Denops, ensure, fn, is, systemopen } from "./deps.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    async campNew(name: unknown): Promise<unknown> {
      assert(name, is.String);
      return await competeNew(name);
    },

    async campOpen(): Promise<void> {
      try {
        await competeOpen(await currentFullPath(denops));
      } catch {
        console.error("invalid problem page");
      }
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
}

async function currentFullPath(denops: Denops): Promise<string> {
  return await fn.expand(denops, "%:p") as string;
}

export async function competeNew(name: string): Promise<string[]> {
  await $`cargo compete new ${name}`.quiet();
  const isMetadata = is.ObjectOf({
    packages: is.ArrayOf(is.ObjectOf({
      targets: is.ArrayOf(is.ObjectOf({
        src_path: is.String,
      })),
    })),
  });
  const json = ensure(
    await $`cargo metadata --manifest-path ${name}/Cargo.toml --no-deps --format-version 1`
      .json(),
    isMetadata,
  );
  return json.packages[0].targets.map((v) => v.src_path);
}

async function competeOpen(source: string): Promise<void> {
  const { dir, name } = $.path.parse(source);
  await $`cargo compete open --bin ${name}`
    .cwd(dir)
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
