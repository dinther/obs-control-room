define("ace/theme/darkplus",["require","exports","module","ace/lib/dom"],function(e,t,n){t.isDark=!0,t.cssClass="ace-darkplus",t.cssText=".ace-darkplus .ace_gutter {background: #282a36;color: rgb(144,145,148)}.ace-darkplus .ace_print-margin {width: 1px;background: #44475a}.ace-darkplus {background-color: #282a36;color: #f8f8f2}.ace-darkplus .ace_cursor {color: #f8f8f0}.ace-darkplus .ace_marker-layer .ace_selection {background: #44475a}.ace-darkplus.ace_multiselect .ace_selection.ace_start {box-shadow: 0 0 3px 0px #282a36;border-radius: 2px}.ace-darkplus .ace_marker-layer .ace_step {background: rgb(198, 219, 174)}.ace-darkplus .ace_marker-layer .ace_bracket {margin: -1px 0 0 -1px;border: 1px solid #a29709}.ace-darkplus .ace_marker-layer .ace_active-line {background: #44475a}.ace-darkplus .ace_gutter-active-line {background-color: #44475a}.ace-darkplus .ace_marker-layer .ace_selected-word {box-shadow: 0px 0px 0px 1px #a29709;border-radius: 3px;}.ace-darkplus .ace_fold {background-color: #50fa7b;border-color: #f8f8f2}.ace-darkplus .ace_keyword {color: #ffffff}.ace-darkplus .ace_constant.ace_language {color: #bd93f9}.ace-darkplus .ace_constant.ace_numeric {color: #bd93f9}.ace-darkplus .ace_constant.ace_character {color: #bd93f9}.ace-darkplus .ace_constant.ace_character.ace_escape {color: #ff79c6}.ace-darkplus .ace_constant.ace_other {color: #bd93f9}.ace-darkplus .ace_support.ace_function {color: #f1fa8c}.ace-darkplus .ace_support.ace_constant {color: #6be5fd}.ace-darkplus .ace_support.ace_class {font-style: normal;color: #66d9ef}.ace-darkplus .ace_support.ace_type {font-style: normal;color: #66d9ef}.ace-darkplus .ace_storage {color: #ff79c6}.ace-darkplus .ace_storage.ace_type {font-style: normal;color: #239eff}.ace-darkplus .ace_invalid {color: #F8F8F0;background-color: #ff79c6}.ace-darkplus .ace_invalid.ace_deprecated {color: #F8F8F0;background-color: #bd93f9}.ace-darkplus .ace_string {color: #ffa96c}.ace-darkplus .ace_identifier {color: #5adfdf}.ace-darkplus .ace_comment {color: #23b223}.ace-darkplus .ace_variable {color: #50fa7b}.ace-darkplus .ace_variable.ace_parameter {font-style: normal;color: #ffb86c}.ace-darkplus .ace_entity.ace_other.ace_attribute-name {color: #50fa7b}.ace-darkplus .ace_entity.ace_name.ace_function {color: #f1fa8c}.ace-darkplus .ace_entity.ace_name.ace_tag {color: #ff79c6}.ace-darkplus .ace_invisible {color: #626680;}.ace-darkplus .ace_indent-guide {background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC) right repeat-y}",t.$selectionColorConflict=!0;var r=e("../lib/dom");r.importCssString(t.cssText,t.cssClass)});                (function() {
                    window.require(["ace/theme/darkplus"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            