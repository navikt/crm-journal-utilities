import { LightningElement, api } from 'lwc';

export default class CrmSearchablePicklist extends LightningElement {
    @api searchOptions;

    searchResults;
    selectedOption;

    handleChange(event) {
        //After inputting more than one charactert searchResults are displayed
        const targetInput = event.currentTarget.value;
        if (targetInput && targetInput > 0) {
            console.log('FILTERING ON: ' + targetInput);
            this.filterOptions(targetInput);
        } else if (targetInput == '' || !targetInput) {
            this.selectedOption = null;
            this.searchResults = this.searchOptions;
        }
    }

    handleKeyPress(event) {
        console.log('KEY PRESSED');
        const targetInput = event.currentTarget.value;
        console.log('INPTU: ' + targetInput);
        if (targetInput && targetInput.length > 0) {
            console.log('FILTERING ON: ' + targetInput);
            this.filterOptions(targetInput);
        } else if (targetInput == '' || !targetInput) {
            this.selectedOption = null;
            this.searchResults = this.searchOptions;
        }
    }

    handleFocusLeave() {
        //this.showResults = false;
    }

    handleFocus() {
        if (!this.selectedOption) {
            if (!this.searchResults || this.searchResults.length == 0) {
                //if first time setting focus, show all results
                this.searchResults = this.searchOptions;
            } else if (this.searchInput && this.searchInput.length > 0) {
                this.filterOptions(this.searchInput);
            }
        }
    }

    filterOptions(searchInput) {
        if (this.searchOptions) {
            this.searchResults = this.searchOptions.filter((option) => {
                return option.label.toLowerCase().startsWith(searchInput.toLowerCase());
            });
        }
    }

    selectOption(event) {
        const option = event.currentTarget.dataset;
        this.selectedOption = option;
        this.lightningInput.value = this.selectedOption.label;
        this.searchResults = [];
    }

    get showSearchResults() {
        return this.hasSearchResults && !this.selectedOption;
    }

    get hasSearchResults() {
        return this.searchResults && this.searchResults.length > 0;
    }

    get lightningInput() {
        return this.template.querySelector('lightning-input');
    }

    get searchInput() {
        this.lightningInput?.value;
    }
}
