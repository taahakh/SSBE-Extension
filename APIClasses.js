class SummaryOptionsController {
    constructor(reqconfig) {
        this.configlist = reqconfig.data;
        this.textTypeList = this.createLinkedList();
        this.tt_selected = null;
        this.st_selected = null;
        this.model_list = null;
        this.model_selected = null;
        this.summary_length_selected = null;
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
            const entry = { 'model-name': config['model-name'], 'summary-length': config['summary-length'] };
      
            textTypeList[textType][summaryType].push(entry);
          }
        }
      
        return textTypeList;
      }

      // Auto selects the SCV details
      setPlaceholder() {
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
        this.configSummaryOptionView(selectedTextType);
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
        this.model_selected = selectedModel;
        return this.model_list.find((model) => model['model-name'] === selectedModel)['summary-length'];
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
        return this.model_selected['model-name'];
      }

}






class SummaryCustomisationView {
    constructor(reqconfig) {
        this.controller = new SummaryOptionsController(reqconfig);
        this.selectedSummaryType = "";
        this.createListeners();
        this.createView();
    }

    setSummaryOptionsController(summaryOptionsController) {
        this.summaryOptionsController = summaryOptionsController;
    }

    switchButtonIdentifier(id) {
      if (id === "sb-1") { return 'sb-2'; }
      else { return 'sb-1'; }
    }

    setButtonSelect(id) {
      let clickedButton = document.getElementById(id);
      // console.log("Setting Button Select: ", id);
      clickedButton.classList.add("selected-state");
      this.selectedSummaryType = id;
    }
    
    buttonSelect(id) {
      //let clickedButton = document.getElementById(id);
      if (id !== this.selectedSummaryType) {
        let otherButton = document.getElementById(this.switchButtonIdentifier(id));
        otherButton.classList.remove("selected-state");
        this.setButtonSelect(id);
      }
    }

    createListeners() {
        console.log("Creating Listeners");

        var tt_dropdown = document.getElementById("td-dropdown-textdomain");
        var st_sb1 = document.getElementById("sb-1");
        var st_sb2 = document.getElementById("sb-2");
        var model_dropdown = document.getElementById("td-dropdown-modelchoice");

        tt_dropdown.addEventListener("change", () => {
            console.log("Text Type Change");
            this.updateFromTextTypeView(
              document.getElementById("td-dropdown-textdomain").value
            );
        });

        st_sb1.addEventListener("click", () => {
            console.log("Summary Type Change - Extractive");
            if (this.selectedSummaryType !== "sb-1") {
              this.buttonSelect("sb-1");
              this.updateFromSummaryTypeView("ex");
            } else {
              this.buttonSelect("sb-1");
            }
        });

        st_sb2.addEventListener("click", () => {
            console.log("Summary Type Change - Abstractive");
            if (this.selectedSummaryType !== "sb-2") {
              this.buttonSelect("sb-2");
              this.updateFromSummaryTypeView("ab");
            } else {
              this.buttonSelect("sb-2");
            }
        });

        model_dropdown.addEventListener("change", () => {
            this.updateFromModelSelectView(document.getElementById("td-dropdown-modelchoice").value);
        });

    } 

    // Change these names
    updateFromTextTypeView(selected){
      console.log(selected);
      var list = this.controller.updateFromTextTypeChange(selected);
      console.log("LISSSTST: ", list);
      
      this.buttonSelect(list['summary-type'] === "ab" ? "sb-2" : "sb-1");

      var model_dropdown = document.getElementById("td-dropdown-modelchoice");
      model_dropdown.innerHTML = "";
      for (const model of list['model-list']) {
        var option = document.createElement("option");
        option.value = model['model-name'];
        option.text = model['model-name'];

        if (model['model-name'] === list['model-selected']) {
          option.selected = true;
        }

        model_dropdown.appendChild(option);
      }

      var minlength = document.getElementById("minlength");
      var maxlength = document.getElementById("maxlength");
      minlength.innerHTML = "Min length: " + list['summary-length']['min'];
      maxlength.innerHTML = "Max length: " + list['summary-length']['max'];

    }

    updateFromSummaryTypeView(selected){
      console.log("Summary type change: ", selected);
      var list = this.controller.updateFromSummaryTypeChange(selected);
      console.log("Updating Summary Type View: ", list);
      
      var model_dropdown = document.getElementById("td-dropdown-modelchoice");
      model_dropdown.innerHTML = "";
      for (const model of list['model-list']) {
        var option = document.createElement("option");
        option.value = model['model-name'];
        option.text = model['model-name'];

        if (model['model-name'] === list['model-selected']) {
          option.selected = true;
        }

        model_dropdown.appendChild(option);
      }

      var minlength = document.getElementById("minlength");
      var maxlength = document.getElementById("maxlength");
      minlength.innerHTML = "Min length: " + list['summary-length']['min'];
      maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
    }

    updateFromModelSelectView(selected){
      console.log("Upadting SL: ", selected);
      var list = this.controller.updateFromModelChange(selected);
      console.log("UpdatingSL2: ", list);
      var minlength = document.getElementById("minlength");
      var maxlength = document.getElementById("maxlength");
      // console.log("MINLENGTH: ", list['model-list']);
      minlength.innerHTML = "Min length: " + list['min'];
      maxlength.innerHTML = "Max length: " + list['max'];
    }
    
    packageSummaryCustomisations() {
      return {
        'model' : this.controller.getModelChoice(),
        'summary-length' : document.getElementById("summary-length").value
      };
    }

    createView() {
        console.log("Creating Summary Options View");
        // create the view
        var list = this.controller.getSummaryOptions();
        console.log("Summary Options: ", list); 

        // Text Types
        var tt_dropdown = document.getElementById("td-dropdown-textdomain");
        for (const tt in list['list']) {
          var option = document.createElement("option");
          option.value = tt;
          option.text = tt;

          if (list['text-type'] === tt) {
            option.selected = true;
          }

          tt_dropdown.appendChild(option);
        }

        // console.log("Text Type Dropdown: ", tt_dropdown);
        
        // Summary Types
        console.log("Summary Type: ", list['summary-type']);
        if (list['summary-type'] === "ab") {
          this.setButtonSelect("sb-2");
        } else {
          console.log("Im here");
          this.setButtonSelect("sb-1");
        }
        
        // Models
        var model_dropdown = document.getElementById("td-dropdown-modelchoice");
        for (const model of list['model-list']) {
          var option = document.createElement("option");
          option.value = model['model-name'];
          option.text = model['model-name'];
          
          if (model['model-name'] === list['model-selected']) {
            option.selected = true;
          }

          model_dropdown.appendChild(option);
        }

        // Summary Length
        var minlength = document.getElementById("minlength");
        var maxlength = document.getElementById("maxlength");
        // console.log("MINLENGTH: ", list['model-list']);
        minlength.innerHTML = "Min length: " + list['summary-length']['min'];
        maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
    }

}