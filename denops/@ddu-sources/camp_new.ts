import { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.3/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.3/types.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.5.3/file.ts";
import { competeNew } from "../camp/main.ts";

type Params = {
  name: string;
};

export class Source extends BaseSource<Params> {
  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items = [];
        if (args.sourceParams.name !== "") {
          for (const path of await competeNew(args.sourceParams.name)) {
            items.push({
              word: path,
              kind: "file",
              action: {
                path,
                isDirectory: false,
              },
            });
          }
        }
        controller.enqueue(items);
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      name: "",
    };
  }
}
