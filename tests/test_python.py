def get_parameters(style_weight_select, quality_select):
    # default = 50
    style_weight = 50
    if style_weight_select == "Realistic +":
        style_weight = 1.0
    if style_weight_select == "Realistic":
        style_weight = 10
    if style_weight_select == "Artistic":
        style_weight = 100
    if style_weight_select == "Artistic +":
        style_weight = 1000
    # default = 100    epochs = 100
                       if quality_select == "Low":
                           epochs = 50
                       if quality_select == "High":
                           epochs = 200
                       return style_weight, epochs

                   msg_1 = sys.argv[1]
                   msg_2 = sys.argv[2]
                   style_weight, epochs = get_parameters(msg_1, msg_2)
                   print(style_weight, epochs)
