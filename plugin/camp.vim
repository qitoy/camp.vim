command! CampOpen call denops#notify("camp", "campOpen", [])
command! CampTest call denops#notify("camp", "campTest", [])
command! -bang CampSubmit call denops#notify("camp", "campSubmit", [<bang>0])
