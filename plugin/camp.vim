command! CampOpen call camp#notify("campOpen")
command! CampTest call camp#notify("campTest")
command! -bang CampSubmit call camp#notify("campSubmit", <bang>0)
