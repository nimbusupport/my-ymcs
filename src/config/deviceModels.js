const rawPhoneModels = [
  { shortType: "AX83H", modelId: "" },
  { shortType: "AX86R", modelId: "" },
  { shortType: "CP920", modelId: "869cb44dc559434387b3a437875b24c0" },
  { shortType: "CP925", modelId: "" },
  { shortType: "CP935W", modelId: "" },
  { shortType: "CP960", modelId: "0ef63c39c5af49d0934a2ef13c537486" },
  { shortType: "CP965", modelId: "3c141fff078b4c92ac81387731335cae" },
  { shortType: "MP54(Teams)", modelId: "61e7bb8eec12449495447a6eb74d39fb" },
  { shortType: "MP56(Teams)", modelId: "db249ca8f83f425baeda09214288d0a9" },
  { shortType: "SIP-T19(P)E2", modelId: "67a7b625953e4ce7ae22ac39fedc1e38" },
  { shortType: "SIP-T21(P)E2", modelId: "28b43d60fc7d47bebd95c280a36d9f89" },
  { shortType: "SIP-T23P", modelId: "446120777bd442168c7183dd79c76e2a" },
  { shortType: "SIP-T23G", modelId: "6f03eb7a5e52470fb458d133ebdcced9" },
  { shortType: "SIP-T27P", modelId: "67442373cd764c428f399688370030e6" },
  { shortType: "SIP-T27G", modelId: "10ed4cf494054547b37ca1fa391728eb" },
  { shortType: "SIP-T29G", modelId: "e39716d7f79e4379a517f5d318605232" },
  { shortType: "SIP-T30", modelId: "743ab3352250454aa338542028c8ee4b" },
  { shortType: "SIP-T30P", modelId: "90dcfad9d8514f1188aaa8c40713d19e" },
  { shortType: "SIP-T31", modelId: "" },
  { shortType: "SIP-T31G", modelId: "29bb397f55b245a091f421798a90151f" },
  { shortType: "SIP-T31P", modelId: "02c47b640c3046dc86853c9ccfd37dd0" },
  { shortType: "SIP-T31W", modelId: "" },
  { shortType: "SIP-T33P", modelId: "a5c773b757d942589cfdf3c0c0749330" },
  { shortType: "SIP-T33G", modelId: "316b490c11014a4db736b05e4a352512" },
  { shortType: "SIP-T34W", modelId: "794c94daaee340ad9d39ed6dce119c0f" },
  { shortType: "SIP-T40P", modelId: "" },
  { shortType: "SIP-T40G", modelId: "919bb1521027476ab0470b8eb75c9299" },
  { shortType: "SIP-T41P", modelId: "ac3401cb877e4189b1c9755c2812489d" },
  { shortType: "SIP-T41S", modelId: "13e5350b88904714977a72dbbd2c3842" },
  { shortType: "SIP-T42G", modelId: "18f6f3ef0ec74b5f88c8a08e282e67d7" },
  { shortType: "SIP-T42S", modelId: "" },
  { shortType: "SIP-T42U", modelId: "" },
  { shortType: "SIP-T43U", modelId: "c744908fe4a84f2f9d08964c91485e42" },
  { shortType: "SIP-T44U", modelId: "ec5ba232a51f4df594f549e1007f689f" },
  { shortType: "SIP-T44W", modelId: "" },
  { shortType: "SIP-T46G", modelId: "f3944243e3184ca4b5d8f2a88f4d4b37" },
  { shortType: "SIP-T46S", modelId: "1b0f75d7dd4547d1b3004690e09632cd" },
  { shortType: "SIP-T46U", modelId: "62832e52b7da4f71925c6bd85570f6fc" },
  { shortType: "SIP-T48G", modelId: "" },
  { shortType: "SIP-T48S", modelId: "7d5508e6e0144dffa14cf01327c6818a" },
  { shortType: "SIP-T48U", modelId: "7c0d60d42ba54593a93b8fdf99902e63" },
  { shortType: "SIP-T52S", modelId: "" },
  { shortType: "SIP-T53", modelId: "" },
  { shortType: "SIP-T53C", modelId: "" },
  { shortType: "SIP-T53W", modelId: "" },
  { shortType: "SIP-T54S", modelId: "" },
  { shortType: "SIP-T54W", modelId: "a62b22794b5440a3818e6207bccdf4f1" },
  { shortType: "SIP-T56A", modelId: "" },
  { shortType: "SIP-T57W", modelId: "119631f4c8644dd48f2ff30521382658" },
  { shortType: "SIP-T58", modelId: "dbc811067ddc482a9ac296d6159c10ed" },
  { shortType: "SIP-T58A", modelId: "" },
  { shortType: "SIP-T58W", modelId: "995380d6fb584805b8579acc3a1fba87" },
  { shortType: "SIP-T73U", modelId: "9dc884f6c0f541ba87058fbb611599d6" },
  { shortType: "SIP-T73W", modelId: "9022e344a6664fdb8ca337f0341e4622" },
  { shortType: "SIP-T74U", modelId: "0dfc7b6b772b4926a9a577705bfc037c" },
  { shortType: "SIP-T74W", modelId: "04ec2cda5a1c47adb09b65a543d3a742" },
  { shortType: "SIP-T77U", modelId: "76e04a2fb3c348d58c115c4137afb814" },
  { shortType: "SIP-T87W", modelId: "f5071a1430c9436ebfac3550d1a5231e" },
  { shortType: "SIP-T88V", modelId: "9c7f0f2bcc1a41649698606be71c5427" },
  { shortType: "T64LTE", modelId: "" },
  { shortType: "T67LTE", modelId: "" },
  { shortType: "VP59", modelId: "3453a8a852df467ca94a32655d7a72c6" },
  { shortType: "W60B", modelId: "bcfa9b91e1c84344ae2e72a37148a75c" },
  { shortType: "W70B", modelId: "1549deee08c940faa861c60d764ab0cd" },
  { shortType: "W75DM", modelId: "" },
  { shortType: "W80DM", modelId: "88947896d6dd46d7b50b36c2dbe47b60" },
  { shortType: "W90DM", modelId: "" }
];

function canonicalizeShortType(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export const phoneModels = rawPhoneModels.map((model) => ({
  ...model,
  searchKey: canonicalizeShortType(model.shortType)
}));

export function searchPhoneModels(query, catalog = phoneModels) {
  const needle = canonicalizeShortType(query);

  if (!needle) {
    return catalog;
  }

  return catalog.filter((model) => model.searchKey.includes(needle));
}

export function resolveModelSelection(modelInput, catalog = phoneModels) {
  const trimmed = String(modelInput ?? "").trim();

  if (!trimmed) {
    return {
      ok: false,
      message: "Model is required. Select a model or paste a YMCS modelId."
    };
  }

  const searchKey = canonicalizeShortType(trimmed);
  const matched = catalog.find((model) => model.searchKey === searchKey);

  if (matched) {
    if (!matched.modelId) {
      return {
        ok: false,
        message: `Model ${matched.shortType} is listed, but its YMCS modelId is not configured yet. Paste the real modelId or update src/config/deviceModels.js.`
      };
    }

    return {
      ok: true,
      modelId: matched.modelId,
      shortType: matched.shortType,
      source: "catalog"
    };
  }

  return {
    ok: true,
    modelId: trimmed,
    shortType: null,
    source: "raw"
  };
}
