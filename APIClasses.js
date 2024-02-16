class SummaryOptionsController {
    constructor(reqconfig) {
        this.configlist = reqconfig.data;
        this.textTypeList = this.createLinkedList();
        console.log("SummaryOptionsController - config list: ", this.configlist);
        console.log("SummaryOptionsController - LinkedList: ", this.textTypeList);
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

      setPlaceholder() {
        const ttlist = Object.keys(this.textTypeList);
        var tt_selected = null;
        var st_selected = null;
        var model_list = null;
        var model_selected = null;

        // Lets get the first text type and summary type that doesn't have an empty model list
        for (const tt of ttlist) {
          const stlist = Object.keys(this.textTypeList[tt]);
      
          for (const st of stlist) {
            if (this.textTypeList[tt][st].length > 0) {
                tt_selected = tt;
                st_selected = st;
                model_list = this.textTypeList[tt][st];
                model_selected = this.textTypeList[tt][st][0];
                console.log(ttlist, tt_selected, st_selected, model_list, model_selected);
                return;
                }
            }
          }
      }

      updateFromModelChange(selectedModel) {}
      updateFromSummaryTypeChange(selectedSummaryType) {}
      updateFromTextTypeChange(selectedTextType) {}
      autoSetPattern(){}

}
