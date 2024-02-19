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

      // Summary Type button identifiers
      this.stb1 = elements[0];
      this.stb2 = elements[1];
      // Summmary Type CSS selected state
      this.stbcss = elements[2];
      // Text Type Domain Dropdown
      this.ttdropdown = elements[3];
      // Model Dropdown
      this.modeldropdown = elements[4];
      // Summary length
      this.milength = elements[5];
      this.malength = elements[6];
      // Summary length value
      this.sumlength = elements[7];

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
    
    if (id == "ex") {
      clickedButton = document.getElementById(this.stb1);
    } 
    else if (id == "ab") {
      clickedButton = document.getElementById(this.stb2);
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

// class SummaryCustomisationView {
//     constructor(reqconfig) {
//         this.controller = new SummaryOptionsController(reqconfig);
//         this.selectedSummaryType = "";
//         this.createListeners();
//         this.createView();
//     }

//     setSummaryOptionsController(summaryOptionsController) {
//         this.summaryOptionsController = summaryOptionsController;
//     }

//     switchButtonIdentifier(id) {
//       return id === "sb-1" ? "sb-2" : "sb-1"
//     }

//     buttonSelect(id) {
//       const clickedButton = document.getElementById(id);

//       if (id !== this.selectedSummaryType || this.selectedSummaryType !== "") {
//         let otherButton = document.getElementById(this.switchButtonIdentifier(id));
//         otherButton.classList.remove("selected-state");
//       }

//       clickedButton.classList.add("selected-state");
//       this.selectedSummaryType = id;
//     }

//     createListeners() {
//         console.log("Creating Listeners");

//         var tt_dropdown = document.getElementById("td-dropdown-textdomain");
//         var st_sb1 = document.getElementById("sb-1");
//         var st_sb2 = document.getElementById("sb-2");
//         var model_dropdown = document.getElementById("td-dropdown-modelchoice");

//         tt_dropdown.addEventListener("change", () => {
//             console.log("Text Type Change");
//             // this.updateFromTextTypeView(
//             //   document.getElementById("td-dropdown-textdomain").value
//             // );
//             this.updateView(ChangeFrom.TEXTTYPE, document.getElementById("td-dropdown-textdomain").value);
//         });

//         st_sb1.addEventListener("click", () => {
//             console.log("Summary Type Change - Extractive");
//             if (this.selectedSummaryType !== "sb-1") {
//               this.buttonSelect("sb-1");
//               // this.updateFromSummaryTypeView("ex");
//               this.updateView(ChangeFrom.SUMMARYTYPE, "ex");
//             } else {
//               this.buttonSelect("sb-1");
//             }
//         });

//         st_sb2.addEventListener("click", () => {
//             console.log("Summary Type Change - Abstractive");
//             if (this.selectedSummaryType !== "sb-2") {
//               this.buttonSelect("sb-2");
//               // this.updateFromSummaryTypeView("ab");
//               this.updateView(ChangeFrom.SUMMARYTYPE, "ab");
//             } else {
//               this.buttonSelect("sb-2");
//             }
//         });

//         model_dropdown.addEventListener("change", () => {
//             console.log("Model dropdown - PICKED: ", document.getElementById("td-dropdown-modelchoice").value)
//             // this.updateFromModelSelectView(document.getElementById("td-dropdown-modelchoice").value);
//             this.updateView(ChangeFrom.MODELSELECT, document.getElementById("td-dropdown-modelchoice").value);
//         });

//         model_dropdown.addEventListener("mouseover", () => {
//           console.log("On mouseover");
//         })

//     } 

//     modelChoiceBuilder(list) {
//       var model_dropdown = document.getElementById("td-dropdown-modelchoice");
//       model_dropdown.innerHTML = "";
//       for (const model of list['model-list']) {
//         var option = document.createElement("option");
//         option.value = model['model-name'];
//         option.text = model['model-name'];

//         if (model['model-name'] === list['model-selected']) {
//           option.selected = true;
//         }

//         model_dropdown.appendChild(option);
//       }
//     }

//     summaryLengthBuilder(list) {
//       var minlength = document.getElementById("minlength");
//       var maxlength = document.getElementById("maxlength");
//       minlength.innerHTML = "Min length: " + list['summary-length']['min'];
//       maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
//     }

//     updateView(change, selectedValue) {
//       var list = null;
//       switch(change) {
//         case ChangeFrom.TEXTTYPE:
//           list = this.controller.updateFromTextTypeChange(selectedValue);
//           break;
//         case ChangeFrom.SUMMARYTYPE:
//           list = this.controller.updateFromSummaryTypeChange(selectedValue);
//           break;
//         case ChangeFrom.MODELSELECT:
//           list = this.controller.updateFromModelChange(selectedValue);
//           break;
//       }

//       switch(change) {
//         case ChangeFrom.TEXTTYPE:
//           this.buttonSelect(list['summary-type'] === "ab" ? "sb-2" : "sb-1");
//         case ChangeFrom.SUMMARYTYPE:
//           this.modelChoiceBuilder(list);
//         case ChangeFrom.MODELSELECT:
//           this.summaryLengthBuilder(list);
//           break;
//       }
//     }

//     createView() {
//         console.log("Creating Summary Options View");
//         // create the view
//         var list = this.controller.getSummaryOptions();
//         console.log("Summary Options: ", list); 

//         // Text Types
//         var tt_dropdown = document.getElementById("td-dropdown-textdomain");
//         for (const tt in list['list']) {
//           var option = document.createElement("option");
//           option.value = tt;
//           option.text = tt;

//           if (list['text-type'] === tt) {
//             option.selected = true;
//           }

//           tt_dropdown.appendChild(option);
//         }
        
//         // Summary Types
//         console.log("Summary Type: ", list['summary-type']);
//         this.buttonSelect(list['summary-type'] === "ab" ? "sb-2" : "sb-1");
        
//         // Models
//         this.modelChoiceBuilder(list);

//         // Summary Length
//         this.summaryLengthBuilder(list);
//     }

//     packageSummaryCustomisations() {
//       return {
//         'model' : this.controller.getModelChoice(),
//         'summary-length' : document.getElementById("summary-length").value
//       };
//     }

//           // // Used when populating the summary customisation options for the first time
//           // getSummaryOptions() {
//           //   return {
//           //     'list' : this.textTypeList,
//           //     'text-type': this.tt_selected,
//           //     'summary-type': this.st_selected,
//           //     'model-list': this.model_list,
//           //     'model-selected': this.model_selected['model-name'],
//           //     'summary-length': this.model_selected['summary-length']
//           //   };
//           // }

//     packageFullCustomisation() {
//       let customisation = this.controller.getSummaryOptions();
//       customisation['summary-length-chosen'] = document.getElementById("summary-length").value;
//       return customisation;
//     }

// }

// class SummaryCustomisationView {
//   constructor(reqconfig) {
//       this.controller = new SummaryOptionsController(reqconfig);
//       this.selectedSummaryType = "";

//       // Summary Type button identifiers
//       this.stb1 = "sb-1";
//       this.stb2 = "sb-2";
//       // Summmary Type CSS selected state
//       this.stbcss = "selected-state";
//       // Text Type Domain Dropdown
//       this.ttdropdown = "td-dropdown-textdomain";
//       this.modeldropdown = "td-dropdown-modelchoice";

//       this.createListeners();
//       this.createView();
//   }

//   setSummaryOptionsController(summaryOptionsController) {
//       this.summaryOptionsController = summaryOptionsController;
//   }

//   switchButtonIdentifier(id) {
//     return id === this.stb1 ? this.stb2 : this.stb1;
//   }

//   buttonSelect(id) {
//     const clickedButton = document.getElementById(id);

//     if (id !== this.selectedSummaryType || this.selectedSummaryType !== "") {
//       let otherButton = document.getElementById(this.switchButtonIdentifier(id));
//       otherButton.classList.remove(this.stbcss);
//     }

//     clickedButton.classList.add(this.stbcss);
//     this.selectedSummaryType = id;
//   }

//   createListeners() {
//       console.log("Creating Listeners");

//       var tt_dropdown = document.getElementById(this.ttdropdown);
//       var st_sb1 = document.getElementById(this.stb1);
//       var st_sb2 = document.getElementById(this.stb2);
//       var model_dropdown = document.getElementById(this.modeldropdown);

//       tt_dropdown.addEventListener("change", () => {
//           console.log("Text Type Change");
//           // this.updateFromTextTypeView(
//           //   document.getElementById("td-dropdown-textdomain").value
//           // );
//           this.updateView(ChangeFrom.TEXTTYPE, document.getElementById(this.ttdropdown).value);
//       });

//       st_sb1.addEventListener("click", () => {
//           console.log("Summary Type Change - Extractive");
//           if (this.selectedSummaryType !== this.stb1) {
//             this.buttonSelect(this.stb1);
//             // this.updateFromSummaryTypeView("ex");
//             this.updateView(ChangeFrom.SUMMARYTYPE, "ex");
//           } else {
//             this.buttonSelect(this.stb1);
//           }
//       });

//       st_sb2.addEventListener("click", () => {
//           console.log("Summary Type Change - Abstractive");
//           if (this.selectedSummaryType !== this.stb2) {
//             this.buttonSelect(this.stb2);
//             // this.updateFromSummaryTypeView("ab");
//             this.updateView(ChangeFrom.SUMMARYTYPE, "ab");
//           } else {
//             this.buttonSelect(this.stb2);
//           }
//       });

//       model_dropdown.addEventListener("change", () => {
//           console.log("Model dropdown - PICKED: ", document.getElementById(this.modeldropdown).value)
//           // this.updateFromModelSelectView(document.getElementById(this.modeldropdown).value);
//           this.updateView(ChangeFrom.MODELSELECT, document.getElementById(this.modeldropdown).value);
//       });

//       model_dropdown.addEventListener("mouseover", () => {
//         console.log("On mouseover");
//       })

//   } 

//   modelChoiceBuilder(list) {
//     var model_dropdown = document.getElementById(this.modeldropdown);
//     model_dropdown.innerHTML = "";
//     for (const model of list['model-list']) {
//       var option = document.createElement("option");
//       option.value = model['model-name'];
//       option.text = model['model-name'];

//       if (model['model-name'] === list['model-selected']) {
//         option.selected = true;
//       }

//       model_dropdown.appendChild(option);
//     }
//   }

//   summaryLengthBuilder(list) {
//     var minlength = document.getElementById("minlength");
//     var maxlength = document.getElementById("maxlength");
//     minlength.innerHTML = "Min length: " + list['summary-length']['min'];
//     maxlength.innerHTML = "Max length: " + list['summary-length']['max'];
//   }

//   updateView(change, selectedValue) {
//     var list = null;
//     switch(change) {
//       case ChangeFrom.TEXTTYPE:
//         list = this.controller.updateFromTextTypeChange(selectedValue);
//         break;
//       case ChangeFrom.SUMMARYTYPE:
//         list = this.controller.updateFromSummaryTypeChange(selectedValue);
//         break;
//       case ChangeFrom.MODELSELECT:
//         list = this.controller.updateFromModelChange(selectedValue);
//         break;
//     }

//     switch(change) {
//       case ChangeFrom.TEXTTYPE:
//         this.buttonSelect(list['summary-type'] === "ab" ? this.stb2 : this.stb1);
//       case ChangeFrom.SUMMARYTYPE:
//         this.modelChoiceBuilder(list);
//       case ChangeFrom.MODELSELECT:
//         this.summaryLengthBuilder(list);
//         break;
//     }
//   }

//   createView() {
//       console.log("Creating Summary Options View");
//       // create the view
//       var list = this.controller.getSummaryOptions();
//       console.log("Summary Options: ", list); 

//       // Text Types
//       var tt_dropdown = document.getElementById(this.ttdropdown);
//       for (const tt in list['list']) {
//         var option = document.createElement("option");
//         option.value = tt;
//         option.text = tt;

//         if (list['text-type'] === tt) {
//           option.selected = true;
//         }

//         tt_dropdown.appendChild(option);
//       }
      
//       // Summary Types
//       console.log("Summary Type: ", list['summary-type']);
//       this.buttonSelect(list['summary-type'] === "ab" ? this.stb2 : this.stb1);
      
//       // Models
//       this.modelChoiceBuilder(list);

//       // Summary Length
//       this.summaryLengthBuilder(list);
//   }

//   packageSummaryCustomisations() {
//     return {
//       'model' : this.controller.getModelChoice(),
//       'summary-length' : document.getElementById("summary-length").value
//     };
//   }

//         // // Used when populating the summary customisation options for the first time
//         // getSummaryOptions() {
//         //   return {
//         //     'list' : this.textTypeList,
//         //     'text-type': this.tt_selected,
//         //     'summary-type': this.st_selected,
//         //     'model-list': this.model_list,
//         //     'model-selected': this.model_selected['model-name'],
//         //     'summary-length': this.model_selected['summary-length']
//         //   };
//         // }

//   packageFullCustomisation() {
//     let customisation = this.controller.getSummaryOptions();
//     customisation['summary-length-chosen'] = document.getElementById("summary-length").value;
//     return customisation;
//   }

// }