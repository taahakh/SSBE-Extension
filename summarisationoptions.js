/**
 * APIClasses.js
 * Contains view and controller classes for managing and creating the visual elements of the summary options.
 * Not necessarily "request API" classes, but classes that manage the API of summary options for the backend service.
 * Contains the SummaryOptionsController and SummaryCustomisationView classes.
 * Used in the popup and settings pages.
 */

/**
 * Enum representing the types of changes.
 * @enum {number}
 */
const ChangeFrom = {
  TEXTTYPE: 1,
  SUMMARYTYPE: 2,
  MODELSELECT: 3,
}

/**
 * A controller for managing summary options.
 * Creates a tree of text types, summary types and models.
 * Allows traversal of the tree to select a model for a given text type and summary type.
 * Tracks and remembers what model and summary length value for use of the backend service
 */
class SummaryOptionsController {
    constructor(reqconfig) {
        this.configlist = reqconfig.data;                 // List of models and their configurations - JSON backend service model descriptors
        this.textTypeList = this.createTree();            // Tree of text types, summary types and models
        this.tt_selected = null;                          // Selected text type       
        this.st_selected = null;                          // Selected summary type
        this.model_list = null;                           // List of models for the selected text type and summary type
        this.model_selected = null;                       // Selected model
        this.summary_length_selected = null;              // Selected summary length
        
        // Default model for each text type
        this.default_text_type_model = {
          "General": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
          "Financial": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
          "Medical": {'summary_type' : 'ab', 'model_name': "T5MedicalSummarisation"},
          "News": {'summary_type' : 'ab', 'model_name': "BartLargeCNN"},
        };

        this.setPlaceholder();                            // Auto select the first available model / default model selection
    }

    /**
     * Creates a tree heirarchy of text types and their corresponding summary types and models.
     * Tree overview: {text types ...} --> { ab --> [models ...], ex --> [models ...] }
     * @returns {Object} The tree of text types with their summary types and entries.
     */
    createTree() {
        const textTypeList = {};
        const cl = this.configlist;
      
        // For each model, create its text type in the tree (if it doesn't exist) and create abstractive and extractive summary types branches (if it doesn't exist)
        // Then add the model to the corresponding summary type branch
        for (const config of cl) {
          const textTypes = config['text-type'];
      
          for (const textType of textTypes) {
            if (!textTypeList[textType]) {
              textTypeList[textType] = { 'ex': [], 'ab': [] };
            }
      
            // Each entry in the summary type list contains the model name, description and summary length
            const summaryType = config['summary-type'];
            const entry = { 'model-name': config['model-name'], 'description': config['description'], 'summary-length': config['summary-length'] };
      
            textTypeList[textType][summaryType].push(entry);
          }
        }
      
        return textTypeList;
      }

      /**
       * Set the default model and summary type for the text type
       * Placeholder is overwritten if there is a user configuration
       */
      setPlaceholder() {

        // Check if there is a default model for the text type and set it
        // Default option is BartLargeCNN
        if (this.getDefaultModelForTextType("General")) {
          return;
        }

        // If no default model is found, select the first available model
        const ttlist = Object.keys(this.textTypeList);

        // Lets get the first text type and summary type that doesn't have an empty model list
        for (const tt of ttlist) {
          const stlist = Object.keys(this.textTypeList[tt]);
      
          // Non-empty model list found, add the first model to the placeholder
          // Set the current text type, summary type, model list and model to the new values
          for (const st of stlist) {
            if (this.textTypeList[tt][st].length > 0) {
                this.tt_selected = tt;
                this.st_selected = st;
                this.model_list = this.textTypeList[tt][st];
                this.model_selected = this.textTypeList[tt][st][0]; // Select the first model
                this.summary_length_selected = this.textTypeList[tt][st][0]['summary-length'];
                return;
                }
            }
          }
      }
      
      /**
       * Retrieves the default model for a given text type.
       *
       * @param {string} textType - The text type for which to retrieve the default model.
       * @returns {boolean} - Returns `true` if the default model is found and updated, otherwise `false`.
       */
      getDefaultModelForTextType(textType) {
        // Check if the text type has a default model
        if (!this.default_text_type_model.hasOwnProperty(textType)) {
          return false;
        }

        // Default model list for the text type
        var models = this.default_text_type_model[textType];
        

        if (
          this.textTypeList.hasOwnProperty(textType) &&                           // Check if the text type exists
          this.textTypeList[textType].hasOwnProperty(models['summary_type']) &&   // Check if the summary type exists
          this.textTypeList[textType][models['summary_type']].length > 0          // Check if the model list is not empty
        ) {
          // Search the BS model tree if it contains the default model
          for (var find of this.textTypeList[textType][models['summary_type']]) {
            // Model exists in the backend service model list, update the SC details
            if (find['model-name'] === models['model_name']) {
              this.configSummaryOptionView(textType);                      // Update current SC details from text type
              this.updateFromSummaryTypeChange(models['summary_type']);    // Update current SC details from summary type 
              this.updateFromModelChange(models['model_name']);            // Update current SC details from model name
              return true;
            }
          }
        }

        return false;

      }

      /**
       * Updates the current summary option based on the selected text type.
       * First available model is selected.
       * @param {number} selected_tt - Text type value.
       */
      configSummaryOptionView(selected_tt) {
        
        this.tt_selected = selected_tt;
        this.st_selected = null;
        this.model_list = null;
        this.model_selected = null;
        this.summary_length_selected = null;

        for (const iter in this.textTypeList[selected_tt]) {
          // Update the current text type, summary type, model list and model to the new values
          if (this.textTypeList[selected_tt][iter].length > 0) {
            this.st_selected = iter;
            this.model_list = this.textTypeList[selected_tt][iter];
            this.model_selected = this.textTypeList[selected_tt][iter][0];
            this.summary_length_selected = this.textTypeList[selected_tt][iter][0]['summary-length'];
            return;
          }
        }
      }

      /**
       * Updates the configuration based on the selected text type, returning summary type, model list, and selected model - used by the view.
       * @param {string} selectedTextType - The selected text type.
       * @returns {Object} - An object containing the updated configuration, used by the view.
       */
      updateFromTextTypeChange(selectedTextType) {
        // Set the default model for the text type if it exists, otherwise use the first available model of that text type
        if (!this.getDefaultModelForTextType(selectedTextType)) {
          this.configSummaryOptionView(selectedTextType);
        }

        return {
          'summary-type': this.st_selected,
          'model-list': this.model_list,
          'model-selected': this.model_selected,
          'summary-length': this.summary_length_selected
        };
      }


      /**
       * Updates the selected summary type and returns the updated model list, selected model, and summary length - used by the view.
       * @param {string} selectedSummaryType - The selected summary type.
       * @returns {Object} - An object containing the updated model list, selected model, and summary length - used by the view.
       */
      updateFromSummaryTypeChange(selectedSummaryType) {
        this.st_selected = selectedSummaryType;
        this.model_list = this.textTypeList[this.tt_selected][selectedSummaryType];
        this.model_selected = this.model_list[0];                                     // Select the first model
        this.summary_length_selected = this.model_list[0]['summary-length'];
        // select model, select summary length and send both the lists
        return {
          'model-list': this.model_list,
          'model-selected': this.model_selected,
          'summary-length': this.summary_length_selected
        };
      }

      /**
       * Updates the selected model based on the provided model name, used by the view.
       * @param {string} selectedModel - The name of the model to select.
       * @returns {object} - The selected model object.
       */
      updateFromModelChange(selectedModel) {
        this.model_selected = this.model_list.find((model) => model['model-name'] === selectedModel);
        return this.model_selected;
      }

      /**
       * Returns an object containing the summary options.
       * Used when populating the summary customisation options for the first time and packaging the customisation for the backend service.
       * @returns {Object} The summary options object.
       */
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
      
      /**
       * Retrieves the currently selected model.
       * @returns {string} The name of the selected model.
       */
      getModelChoice() {
        return this.model_selected['model-name'];
      }

}


/**
 * Represents a view for customising summary options.
 * Used to create and manage the view for text types, summary types, models, and summary length.
 * Allows the user to select a text type, summary type, model, and summary length and displays the options.
 * Used in popup and settings pages.
 * @class
 */
class SummaryCustomisationView {
  constructor(reqconfig, elements) {
      // Uses the SummaryOptionsController to manage the summary options 
      this.controller = new SummaryOptionsController(reqconfig);
      this.selectedSummaryType = "";                    // Store selected summary type

      this.stheader = elements[0];                      // Summary Type Header
      this.stb1 = elements[1];                          // Extractive button
      this.stb2 = elements[2];                          // Abstractive button
      this.stbcss = elements[3];                        // Summmary Type CSS selected state
      this.ttheader = elements[4];                      // Text Type Header  
      this.ttdropdown = elements[5];                    // Text Type Domain Dropdown
      this.modelheader = elements[6];                   // Model Header
      this.modeldropdown = elements[7];                 // Model Dropdown 
      this.slheader = elements[8];                      // Summary Length Header
      this.milength = elements[9];                      // Minimum summary length
      this.malength = elements[10];                     // Maximum summary length
      this.sumlength = elements[11];                    // Summary length value 
      this.ttpp = elements[12];                         // Text Type Popup - contextual information
      this.stpp = elements[13];                         // Summary Type Popup - contextual information
      this.mcpp = elements[14];                         // Model Choice Popup - contextual information
      this.slpp = elements[15];                         // Summary Length Popup - contextual information 

      this.createListeners();                           // Create listeners for the elements of the page
      this.createView();                                // Create the view
  }

  /**
   * Sets the summary options controller.
   *
   * @param {SummaryOptionsController} summaryOptionsController - The summary options controller to set.
   */
  setSummaryOptionsController(summaryOptionsController) {
      this.summaryOptionsController = summaryOptionsController;
  }

  /**
   * Switches the button identifier between extractive and abstractive.
   * @param {string} id - The current button identifier.
   * @returns {string} - The switched button identifier.
   */
  switchButtonIdentifier(id) {
    return id === this.stb1 ? this.stb2 : this.stb1;
  }

  /**
   * Manages button selection of the extractive and abstractive buttons, changing the selected state and css.
   *
   * @param {string} id - The ID of the button to be selected.
   */
  buttonSelect(id) {
    var clickedButton = null;
    
    // Clear CSS styling from the buttons
    var stb1 = document.getElementById(this.stb1);
    var stb2 = document.getElementById(this.stb2);
    stb1.classList.remove(this.stbcss);
    stb2.classList.remove(this.stbcss);

    // Update the selected summary type
    if (id == "ex") {
      clickedButton = stb1;
    } 
    else if (id == "ab") {
      clickedButton = stb2;
    } 
    else { clickedButton = document.getElementById(id); }

    // Remove the CSS styling from the other button
    if (id !== this.selectedSummaryType || this.selectedSummaryType !== "") {
      let otherButton = document.getElementById(this.switchButtonIdentifier(id));
      otherButton.classList.remove(this.stbcss);
    }

    // Add the CSS styling to the clicked button
    clickedButton.classList.add(this.stbcss);

    // Update the selected summary type
    this.selectedSummaryType = id;
  }

  /**
   * Creates event listeners for elements (text type, summary type, model choice and summary length) in the UI.
   */
  createListeners() {
      // Information popups
      var popups_static = [document.getElementById(this.ttpp),
                           document.getElementById(this.stpp),
                           document.getElementById(this.mcpp),
                           document.getElementById(this.slpp)];
      
      // Headers when clicked shows the popup
      var headers_static = [document.getElementById(this.ttheader),
                            document.getElementById(this.stheader),
                            document.getElementById(this.modelheader),
                            document.getElementById(this.slheader)]

      var tt_dropdown = document.getElementById(this.ttdropdown); // Text Type Dropdown
      var st_sb1 = document.getElementById(this.stb1); // Extractive Button
      var st_sb2 = document.getElementById(this.stb2); // Abstractive Button
      var model_dropdown = document.getElementById(this.modeldropdown); // Model Dropdown

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

      // Update the view when the text type is changed
      tt_dropdown.addEventListener("change", () => {
          this.updateView(ChangeFrom.TEXTTYPE, document.getElementById(this.ttdropdown).value);
      });

      // Update the view when the summary type is changed (extractive)
      st_sb1.addEventListener("click", () => {
          if (this.selectedSummaryType !== this.stb1) {
            this.buttonSelect(this.stb1);
            this.updateView(ChangeFrom.SUMMARYTYPE, "ex");
          } else {
            this.buttonSelect(this.stb1);
          }
      });

      // Update the view when the summary type is changed (abstractive)
      st_sb2.addEventListener("click", () => {
          // console.log("Summary Type Change - Abstractive");
          if (this.selectedSummaryType !== this.stb2) {
            this.buttonSelect(this.stb2);
            this.updateView(ChangeFrom.SUMMARYTYPE, "ab");
          } else {
            this.buttonSelect(this.stb2);
          }
      });

      // Update the view when the model is changed
      model_dropdown.addEventListener("change", () => {
          this.updateView(ChangeFrom.MODELSELECT, document.getElementById(this.modeldropdown).value);
      });

  } 

  /**
   * Builds the model choice dropdown and popup based on the provided list of models.
   * @param {Object} list - The list of models.
   */
  modelChoiceBuilder(list) {
    var model_popup = document.getElementById(this.mcpp);             // Model Choice Popup
    var model_dropdown = document.getElementById(this.modeldropdown); // Model Dropdown
    var popup_text = "<h3>Description of models</h3> <br>";           // Popup text header
    
    // Clear the model dropdown options
    model_dropdown.innerHTML = "";
    
    // Create the model dropdown options and popup text
    for (const model of list['model-list']) {
      var option = document.createElement("option");
      option.value = model['model-name'];
      option.text = model['model-name'];

      // Set the selected model in the dropdown
      if (model['model-name'] === list['model-selected']['model-name']) {
        option.selected = true;
      }
      
      // Add the model description to the popup text
      popup_text += '<p><strong>'+ model['model-name'] + '</strong>' +': ' + model['description'] + '</p>' + '<br>';

      model_dropdown.appendChild(option);
    }
    model_popup.innerHTML = popup_text;
  }

  // Not used to display the summary length, done by model choice builder
  // REDUNDANT
  summaryLengthBuilder(list) {
    console.log("SLB: ", list);
  }

  /**
   * Updates the view based on the given change from the view - what the user has selected.
   *
   * @param {ChangeFrom} change - The type of change.
   * @param {string} selectedValue - The selected value.
   */
  updateView(change, selectedValue) {
    var list = null;
    
    // Update the controller based on the change
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
    
    // Update the view based on the change set by the controller
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

  /**
   * Creates the view for the summary options.
   */
  createView() {

      // Summary Options to be displayed
      var list = this.controller.getSummaryOptions();

      // Text Types
      var tt_dropdown = document.getElementById(this.ttdropdown);

      // Create the text type dropdown options
      for (const tt in list['list']) {
        var option = document.createElement("option");
        option.value = tt;
        option.text = tt;

        if (list['text-type'] === tt) {
          option.selected = true;
        }

        tt_dropdown.appendChild(option);
      }
      
      // Set summary types
      this.buttonSelect(list['summary-type'] === "ab" ? this.stb2 : this.stb1);
      
      // Create model choice view
      this.modelChoiceBuilder(list);

      // Summary Length view
      this.summaryLengthBuilder(list);
  }

  /**
   * Sets the predefined options (user configurations) for the text, summary type, model, and summary length --> updates the view.
   * @param {string} text - The text value to set.
   * @param {string} st - The summary type value to set.
   * @param {string} model - The model value to set.
   * @param {number|null} slvalue - The summary length value to set. Defaults to null if not provided.
   */
  setPredefinedOptions(text, st, model, slvalue=null) {
    // Update text type
    this.updateView(ChangeFrom.TEXTTYPE, text);
    var tt_dropdown = document.getElementById(this.ttdropdown);
    tt_dropdown.value = text;

    // Update summary type
    this.updateView(ChangeFrom.SUMMARYTYPE, st);
    this.buttonSelect(st);

    // Update model
    this.updateView(ChangeFrom.MODELSELECT, model);
    var model_dropdown = document.getElementById(this.modeldropdown);
    model_dropdown.value = model;

    // Update summary length
    if (slvalue || slvalue === 0 || slvalue === "") {
      document.getElementById(this.sumlength).value = slvalue;
    }
  }

  /**
   * Returns the summary length value.
   * @returns {number} The summary length value.
   */
  getSummaryLength() {
    return document.getElementById(this.sumlength).value;
  }

  /**
   * Returns an object containing customisations needed for backend service summarisation.
   * @returns {Object} An object with customisations for package summary.
   */
  packageSummaryCustomisations() {
    return {
      'model' : this.controller.getModelChoice(),
      'summary-length' : this.getSummaryLength()
    };
  }

  /**
   * Retrieves the full customisation package.
   * @returns {Object} The customisation package.
   */
  packageFullCustomisation() {
    let customisation = this.controller.getSummaryOptions();
    customisation['summary-length-chosen'] = document.getElementById(this.sumlength).value;
    return customisation;
  }

}