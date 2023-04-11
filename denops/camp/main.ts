import {
    $,
    Denops,
    fn,
    assertNumber,
    parse,
}from "./deps.ts";

export function main(denops: Denops): Promise<void> {
    denops.dispatcher = {
        async campTest(): Promise<void> {
            const [_, output] = await competeTest(await fn.expand(denops, "%:p") as string);
            await denops.call("camp#write", "test", output);
        },
        async campSubmit(force: unknown): Promise<void> {
            assertNumber(force);
            if(!force) {
                const [success, output] = await competeTest(await fn.expand(denops, "%:p") as string);
                if(!success) {
                    await denops.call("camp#write", "test", output);
                    return;
                }
                if(await fn.confirm(denops, "Submit?", "&Yes\n&No", 0, "Question") !== 1) {
                    denops.cmd('echo "canceled"');
                    return;
                }
            }
            const uri = await competeSubmit(await fn.expand(denops, "%:p") as string);
            try {
                denops.call("openbrowser#open", uri);
            } catch(_) { /*do noting*/ }
        },
    };
    return Promise.resolve();
}

async function competeTest(source: string): Promise<[boolean, string[]]> {
    const { dir, name } = parse(source);
    const { code, combined } = await $`cargo compete test ${name}`
        .captureCombined()
        .cwd(dir)
        .noThrow()
        .spawn();
    return [code === 0, combined.split("\n")];
}

async function competeSubmit(source: string): Promise<string> {
    const { dir, name } = parse(source);
    const lines = await $`cargo compete submit ${name} --no-test --no-watch`
        .captureCombined()
        .cwd(dir)
        .noThrow()
        .lines();
    let uri = "";
    for(const line of lines) {
        if(line.includes("URL (detail)")) {
            uri = line.replace(/^.*(https\S+).*$/, "$1");
        }
    }
    return uri;
}
