" command! -nargs=1 CampNew call camp#request("campNew", <q-args>)
command! CampOpen call camp#notify("campOpen")
command! CampTest call camp#notify("campTest")
command! -bang CampSubmit call camp#notify("campSubmit", <bang>0)
