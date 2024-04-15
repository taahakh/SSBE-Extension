const ChangeFrom = {
  TEXTTYPE: 1,
  SUMMARYTYPE: 2,
  MODELSELECT: 3,
}

class SummaryOptionsController {
    constructor(reqconfig) {
        this.configlist = reqconfig.data;
        this.textTypeList = this.createLinkedList();
        this.tt_selected = null;
        this.st_selected = null;
        this.model_list = null;
        this.model_selected = null;
        this.summary_length_selected = null;
        this.default_text_type_model = {
          "General": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
          "Financial": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
          "Medical": {'summary_type' : 'ab', 'model_name': "T5MedicalSummarisation"},
          "News": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
        };
        console.log("SummaryOptionsController - config list: ", this.configlist);
        console.log("SummaryOptionsController - TreeList: ", this.textTypeList);
        this.setPlaceholder();
    }

    createLinkedList() {
        const textTypeList = {};
        const cl = this.configlist;
      
        for (const config of cl) {
          const textTypes = config['text-type'];
      
          for (const textType of textTypes) {
            if (!textTypeList[textType]) {
              textTypeList[textType] = { 'ex': [], 'ab': [] };
            }
      
            const summaryType = config['summary-type'];
            const entry = { 'model-name': config['model-name'], 'description': config['description'], 'summary-length': config['summary-length'] };
      
            textTypeList[textType][summaryType].push(entry);
          }
        }
      
        return textTypeList;
      }

      // Auto selects the SCV details
      setPlaceholder() {

        // Default option is BartLargeCNN
        if (this.getDefaultModelForTextType("General")) {
          return;
        }

        const ttlist = Object.keys(this.textTypeList);

        // Lets get the first text type and summary type that doesn't have an empty model list
        for (const tt of ttlist) {
          const stlist = Object.keys(this.textTypeList[tt]);
      
          for (const st of stlist) {
            if (this.textTypeList[tt][st].length > 0) {
                this.tt_selected = tt;
                this.st_selected = st;
                this.model_list = this.textTypeList[tt][st];
                this.model_selected = this.textTypeList[tt][st][0];
                this.summary_length_selected = this.textTypeList[tt][st][0]['summary-length'];
                console.log(ttlist, this.tt_selected, this.st_selected, this.model_list, this.model_selected);
                return;
                }
            }
          }
      }

      // View the current SC details
      viewConfigSummaryOptionView() {
        console.log("Summary Options: ", this.textTypeList);
        console.log("SELECTED [Text Type]: ", this.tt_selected);
        console.log("SELECTED [Summary Type]: ", this.st_selected);
        console.log("SELECTED [Model List]: ", this.model_list);
      }
      
      getDefaultModelForTextType(textType) {
        if (!this.default_text_type_model.hasOwnProperty(textType)) {
          return false;
        }

        var models = this.default_text_type_model[textType];
        
        if (
          this.textTypeList.hasOwnProperty(textType) && 
          this.textTypeList[textType].hasOwnProperty(models['summary_type']) && 
          this.textTypeList[textType][models['summary_type']].length > 0
        ) {
          for (var find of this.textTypeList[textType][models['summary_type']]) {
            if (find['model-name'] === models['model_name']) {
              this.configSummaryOptionView(textType);
              this.updateFromSummaryTypeChange(models['summary_type']);
              this.updateFromModelChange(models['model_name']);
              return true;
            }
          }
        }

        return false;

      }

      // Update the SC details based on the selected text type
      configSummaryOptionView(selected_tt) {
        
        this.tt_selected = selected_tt;
        this.st_selected = null;
        this.model_list = null;
        this.model_selected = null;
        this.summary_length_selected = null;

        for (const iter in this.textTypeList[selected_tt]) {
          if (this.textTypeList[selected_tt][iter].length > 0) {
            this.st_selected = iter;
            this.model_list = this.textTypeList[selected_tt][iter];
            this.model_selected = this.textTypeList[selected_tt][iter][0];
            this.summary_length_selected = this.textTypeList[selected_tt][iter][0]['summary-length'];
            console.log(this.tt_selected, this.st_selected, this.model_list, this.model_selected);
            return;
          }
        }
      }

      updateFromTextTypeChange(selectedTextType) {
        if (!this.getDefaultModelForTextType(selectedTextType)) {
          // return;
          console.log("no default model for text type: ", selectedTextType)
          this.configSummaryOptionView(selectedTextType);
        }
        // this.configSummaryOptionView(selectedTextType);
        // select model, select summary length and send summary list
        return {
          'summary-type': this.st_selected,
          'model-list': this.model_list,
          'model-selected': this.model_selected,
          'summary-length': this.summary_length_selected
        };
      }

      // ADD CODE TO CHECK IF THERE IS A MODEL ASSOCIATED WITH THE SELECTED SUMMARY TYPE
      // AND TEXT TYPE. CURRENTLY NAIVE IMPLEMENTATION
      updateFromSummaryTypeChange(selectedSummaryType) {
        this.st_selected = selectedSummaryType;
        this.model_list = this.textTypeList[this.tt_selected][selectedSummaryType];
        this.model_selected = this.model_list[0];
        this.summary_length_selected = this.model_list[0]['summary-length'];
        // select model, select summary length and send both the lists
        return {
          'model-list': this.model_list,
          'model-selected': this.model_selected,
          'summary-length': this.summary_length_selected
        };
      }

      updateFromModelChange(selectedModel) {
        // console.log(" updateFromModelChange - SELECTED MODEL : ", selectedModel)
        // console.log(this.model_list.find((model) => model['model-name'] === selectedModel))
        this.model_selected = this.model_list.find((model) => model['model-name'] === selectedModel);
        return this.model_selected;
      }

      // Used when populating the summary customisation options for the first time
      getSummaryOptions() {
        return {
          'list' : this.textTypeList,
          'text-type': this.tt_selected,
          'summary-type': this.st_selected,
          'model-list': this.model_list,
          'model-selected': this.model_selected['model-name'],
          'summary-length': this.model_selected['summary-length']
        };
      }
      
      getModelChoice() {
        console.log("getModelChoice: ", this.model_selected)
        return this.model_selected['model-name'];
      }

}


class SummaryCustomisationView {
  constructor(reqconfig, elements) {
      this.controller = new SummaryOptionsController(reqconfig);
      this.selectedSummaryType = "";

      // Summary type section name
      this.stheader = elements[0];
      // Summary Type button identifiers
      this.stb1 = elements[1];
      this.stb2 = elements[2];
      // Summmary Type CSS selected state
      this.stbcss = elements[3];
      // Text Type section name
      this.ttheader = elements[4];
      // Text Type Domain Dropdown
      this.ttdropdown = elements[5];
      // Model select section name
      this.modelheader = elements[6];
      // Model Dropdown
      this.modeldropdown = elements[7];
      // Summary length section name
      this.slheader = elements[8];
      // Summary length
      this.milength = elements[9];
      this.malength = elements[10];
      // Summary length value
      this.sumlength = elements[11];
      // Popup boxes
      this.ttpp = elements[12];
      this.stpp = elements[13];
      this.mcpp = elements[14];
      this.slpp = elements[15];

      this.createListeners();
      this.createView();
  }

  setSummaryOptionsController(summaryOptionsController) {
      this.summaryOptionsController = summaryOptionsController;
  }

  switchButtonIdentifier(id) {
    return id === this.stb1 ? this.stb2 : this.stb1;
  }

  buttonSelect(id) {
    var clickedButton = null;
    
    var stb1 = document.getElementById(this.stb1);
    var stb2 = document.getElementById(this.stb2);
    stb1.classList.remove(this.stbcss);
    stb2.classList.remove(this.stbcss);

    if (id == "ex") {
      clickedButton = stb1;
    } 
    else if (id == "ab") {
      clickedButton = stb2;
    } 
    else { clickedButton = document.getElementById(id); }

    if (id !== this.selectedSummaryType || this.selectedSummaryType !== "") {
      let otherButton = document.getElementById(this.switchButtonIdentifier(id));
      otherButton.classList.remove(this.stbcss);
    }

    clickedButton.classList.add(this.stbcss);
    this.selectedSummaryType = id;
  }

  createListeners() {
      console.log("Creating Listeners");

      var popups_static = [document.getElementById(this.ttpp),
                           document.getElementById(this.stpp),
                           document.getElementById(this.mcpp),
                           document.getElementById(this.slpp)];
      
      var headers_static = [document.getElementById(this.ttheader),
                            document.getElementById(this.stheader),
                            document.getElementById(this.modelheader),
                            document.getElementById(this.slheader)]

      console.log("Listeners: ", popups_static, headers_static);

      var tt_dropdown = document.getElementById(this.ttdropdown);
      var st_sb1 = document.getElementById(this.stb1);
      var st_sb2 = document.getElementById(this.stb2);
      var model_dropdown = document.getElementById(this.modeldropdown);

      for (let i=0; i<headers_static.length; i++) {
        headers_static[i].addEventListener("click", function() {

          for (let j = 0; j < popups_static.length; j++) {
            if (j !== i) {
              popups_static[j].classList.add('hidden');
            }
          }

          popups_static[i].classList.toggle('hidden');
        })
      }

      tt_dropdown.addEventListener("change", () => {
          console.log("Text Type Change");
          // this.updateFromTextTypeView(
          //   document.getElementById("td-dropdown-textdomain").value
          // );
          this.updateView(ChangeFrom.TEXTTYPE, document.getElementById(this.ttdropdown).value);
      });

      st_sb1.addEventListener("click", () => {
          console.log("Summary Type Change - Extractive");
          if (this.selectedSummaryType !== this.stb1) {
            this.buttonSelect(this.stb1);
            // this.updateFromSummaryTypeView("ex");
            this.updateView(ChangeFrom.SUMMARYTYPE, "ex");
          } else {
            this.buttonSelect(this.stb1);
          }
      });

      st_sb2.addEventListener("click", () => {
          console.log("Summary Type Change - Abstractive");
          if (this.selectedSummaryType !== this.stb2) {
            this.buttonSelect(this.stb2);
            // this.updateFromSummaryTypeView("ab");
            this.updateView(ChangeFrom.SUMMARYTYPE, "ab");
          } else {
            this.buttonSelect(this.stb2);
          }
      });

      model_dropdown.addEventListener("change", () => {
          console.log("Model dropdown - PICKED: ", document.getElementById(this.modeldropdown).value)
          // this.updateFromModelSelectView(document.getElementById(this.modeldropdown).value);
          this.updateView(ChangeFrom.MODELSELECT, document.getElementById(this.modeldropdown).value);
      });

      // model_dropdown.addEventListener("mouseover", () => {
      //   console.log("On mouseover");
      // })

  } 

  modelChoiceBuilder(list) {
    console.log("Model choice builder: ", list);
    var model_popup = document.getElementById(this.mcpp);
    var model_dropdown = document.getElementById(this.modeldropdown);
    var popup_text = "<h3>Description of models</h3> <br>";
    model_dropdown.innerHTML = "";
    for (const model of list['model-list']) {
      var option = document.createElement("option");
      option.value = model['model-name'];
      option.text = model['model-name'];

      if (model['model-name'] === list['model-selected']['model-name']) {
        option.selected = true;
      }
      // '\n\n'
      popup_text += '<p><strong>'+ model['model-name'] + '</strong>' +': ' + model['description'] + '</p>' + '<br>';

      model_dropdown.appendChild(option);
    }
    model_popup.innerHTML = popup_text;
  }

  summaryLengthBuilder(list) {
    // console.log("Summary length builder: ", list, this.milength, this.malength);
    // var minlength = document.getElementById(this.milength);
    // var maxlength = document.getElementById(this.malength);
    // minlength.innerHTML = "Min length: " + list['summary-length']['min'];
    // maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
  }

  updateView(change, selectedValue) {
    var list = null;
    switch(change) {
      case ChangeFrom.TEXTTYPE:
        console.log("ChangeFrom: t", ChangeFrom.TEXTTYPE);
        list = this.controller.updateFromTextTypeChange(selectedValue);
        break;
      case ChangeFrom.SUMMARYTYPE:
        console.log("ChangeFrom: s", ChangeFrom.SUMMARYTYPE);
        list = this.controller.updateFromSummaryTypeChange(selectedValue);
        break;
      case ChangeFrom.MODELSELECT:
        console.log("ChangeFrom: m", ChangeFrom.MODELSELECT);
        list = this.controller.updateFromModelChange(selectedValue);
        break;
    }
    console.log("List: ", list);
    switch(change) {
      case ChangeFrom.TEXTTYPE:
        this.buttonSelect(list['summary-type'] === "ab" ? this.stb2 : this.stb1);
      case ChangeFrom.SUMMARYTYPE:
        this.modelChoiceBuilder(list);
      case ChangeFrom.MODELSELECT:
        this.summaryLengthBuilder(list);
        break;
    }
  }

  createView() {
      console.log("Creating Summary Options View");
      // create the view
      var list = this.controller.getSummaryOptions();
      console.log("Summary Options: ", list); 

      // Text Types
      var tt_dropdown = document.getElementById(this.ttdropdown);
      for (const tt in list['list']) {
        var option = document.createElement("option");
        option.value = tt;
        option.text = tt;

        if (list['text-type'] === tt) {
          option.selected = true;
        }

        tt_dropdown.appendChild(option);
      }
      
      // Summary Types
      console.log("Summary Type: ", list['summary-type']);
      this.buttonSelect(list['summary-type'] === "ab" ? this.stb2 : this.stb1);
      
      // Models
      this.modelChoiceBuilder(list);

      // Summary Length
      this.summaryLengthBuilder(list);
  }

  setPredefinedOptions(text, st, model, slvalue=null) {
    this.updateView(ChangeFrom.TEXTTYPE, text);
    var tt_dropdown = document.getElementById(this.ttdropdown);
    tt_dropdown.value = text;

    this.updateView(ChangeFrom.SUMMARYTYPE, st);
    this.buttonSelect(st);

    this.updateView(ChangeFrom.MODELSELECT, model);
    var model_dropdown = document.getElementById(this.modeldropdown);
    model_dropdown.value = model;

    if (slvalue) {
      document.getElementById(this.sumlength).value = slvalue;
    }
  }

  getSummaryLength() {
    return document.getElementById(this.sumlength).value;
  }

  packageSummaryCustomisations() {
    return {
      'model' : this.controller.getModelChoice(),
      'summary-length' : this.getSummaryLength()
    };
  }

  packageFullCustomisation() {
    let customisation = this.controller.getSummaryOptions();
    customisation['summary-length-chosen'] = document.getElementById(this.sumlength).value;
    return customisation;
  }

}