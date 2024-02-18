class SummaryCustomisationView {
    constructor(reqconfig) {
        this.controller = new SummaryOptionsController(reqconfig);
        this.selectedSummaryType = "";
  
        // Summary Type button identifiers
        this.stb1 = "sb-1";
        this.stb2 = "sb-2";
        // Summmary Type CSS selected state
        this.stbcss = "selected-state";
        // Text Type Domain Dropdown
        this.ttdropdown = "td-dropdown-textdomain";
        // Model Dropdown
        this.modeldropdown = "td-dropdown-modelchoice";
        // Summary length
        this.milength = "minlength";
        this.malength = "maxlength";
        // Summary length value
        this.sumlength = "summary-length";

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
      const clickedButton = document.getElementById(id);
  
      if (id !== this.selectedSummaryType || this.selectedSummaryType !== "") {
        let otherButton = document.getElementById(this.switchButtonIdentifier(id));
        otherButton.classList.remove(this.stbcss);
      }
  
      clickedButton.classList.add(this.stbcss);
      this.selectedSummaryType = id;
    }
  
    createListeners() {
        console.log("Creating Listeners");
  
        var tt_dropdown = document.getElementById(this.ttdropdown);
        var st_sb1 = document.getElementById(this.stb1);
        var st_sb2 = document.getElementById(this.stb2);
        var model_dropdown = document.getElementById(this.modeldropdown);
  
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
  
        model_dropdown.addEventListener("mouseover", () => {
          console.log("On mouseover");
        })
  
    } 
  
    modelChoiceBuilder(list) {
      var model_dropdown = document.getElementById(this.modeldropdown);
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
    }
  
    summaryLengthBuilder(list) {
      var minlength = document.getElementById(this.milength);
      var maxlength = document.getElementById(this.malength);
      minlength.innerHTML = "Min length: " + list['summary-length']['min'];
      maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
    }
  
    updateView(change, selectedValue) {
      var list = null;
      switch(change) {
        case ChangeFrom.TEXTTYPE:
          list = this.controller.updateFromTextTypeChange(selectedValue);
          break;
        case ChangeFrom.SUMMARYTYPE:
          list = this.controller.updateFromSummaryTypeChange(selectedValue);
          break;
        case ChangeFrom.MODELSELECT:
          list = this.controller.updateFromModelChange(selectedValue);
          break;
      }
  
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
  
    packageSummaryCustomisations() {
      return {
        'model' : this.controller.getModelChoice(),
        'summary-length' : document.getElementById(this.sumlength).value
      };
    }
  
          // // Used when populating the summary customisation options for the first time
          // getSummaryOptions() {
          //   return {
          //     'list' : this.textTypeList,
          //     'text-type': this.tt_selected,
          //     'summary-type': this.st_selected,
          //     'model-list': this.model_list,
          //     'model-selected': this.model_selected['model-name'],
          //     'summary-length': this.model_selected['summary-length']
          //   };
          // }
  
    packageFullCustomisation() {
      let customisation = this.controller.getSummaryOptions();
      customisation['summary-length-chosen'] = document.getElementById(this.sumlength).value;
      return customisation;
    }
  
  }