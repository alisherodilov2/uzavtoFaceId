/**
 * @version 2.1.1
 * @license MIT
 */
(function(ng, undefined) {
    "use strict";
    ng.module("smart-table", []).run([
        "$templateCache",
        function($templateCache) {
            $templateCache.put(
                "template/smart-table/pagination.html",
                '<nav ng-if="numPages && pages.length >= 2"><ul class="pagination">' +
                    '<li ng-repeat="page in pages" ng-class="{active: page==currentPage}"><a href="javascript: void(0);" ng-click="selectPage(page)">{{page}}</a></li>' +
                    "</ul></nav>"
            );
        }
    ]);

    ng.module("smart-table").constant("stConfig", {
        pagination: {
            template: "template/smart-table/pagination.html",
            itemsByPage: 10,
            displayedPages: 5
        },
        search: {
            delay: 400, // ms
            inputEvent: "input"
        },
        select: {
            mode: "single",
            selectedClass: "st-selected"
        },
        sort: {
            ascentClass: "st-sort-ascent",
            descentClass: "st-sort-descent",
            descendingFirst: false,
            skipNatural: false,
            delay: 300
        },
        pipe: {
            delay: 100 //ms
        }
    });
    ng.module("smart-table")
        .controller("stTableController", [
            "$scope",
            "$parse",
            "$filter",
            "$attrs",
            "stConfig",
            function StTableController($scope, $parse, $filter, $attrs, stConfig) {
                stConfig.select.mode = "single";
                var propertyName = $attrs.stTable;
                var displayGetter = $parse(propertyName);
                var displaySetter = displayGetter.assign;
                var safeGetter;
                var orderBy = $filter("orderBy");
                var filter = $filter("filter");
                var safeCopy = copyRefs(displayGetter($scope));
                var tableState = {
                    sort: {},
                    search: {},
                    pagination: {
                        start: 0,
                        totalItemCount: 0
                    }
                };
                var filtered;
                var pipeAfterSafeCopy = true;
                var ctrl = this;
                var lastSelected;
                var lastSelectedIndex = -1;

                function copyRefs(src) {
                    return src ? [].concat(src) : [];
                }

                function updateSafeCopy() {
                    safeCopy = copyRefs(safeGetter($scope));
                    if (pipeAfterSafeCopy === true) {
                        ctrl.pipe();
                    }
                    try {
                        setTimeout(function() {
                            ctrl.resetHeadPosition();
                        }, 10);
                    } catch (e) {}
                }

                this.setLastIndex = function(iIndex) {
                    lastSelectedIndex = iIndex;
                };

                function deepDelete(object, path) {
                    if (path.indexOf(".") != -1) {
                        var partials = path.split(".");
                        var key = partials.pop();
                        var parentPath = partials.join(".");
                        var parentObject = $parse(parentPath)(object);
                        delete parentObject[key];
                        if (Object.keys(parentObject).length == 0) {
                            deepDelete(object, parentPath);
                        }
                    } else {
                        delete object[path];
                    }
                }

                if ($attrs.stTable) {
                    $scope.$watch(
                        function() {
                            var safeDisplay = displayGetter($scope);
                            return safeDisplay && safeDisplay.length ? safeDisplay[0] : undefined;
                        },
                        function(newValue, oldValue) {
                            try {
                                setTimeout(function() {
                                    ctrl.resetHeadPosition(true);
                                }, 10);
                            } catch (e) {}
                        }
                    );
                    $scope.$watch(
                        function() {
                            var safeDisplay = displayGetter($scope);
                            return safeDisplay ? safeDisplay.length : 0;
                        },
                        function(newValue, oldValue) {
                            try {
                                setTimeout(function() {
                                    ctrl.resetHeadPosition(true);
                                }, 10);
                            } catch (e) {}
                        }
                    );
                    $scope.$watch(
                        function() {
                            return displayGetter($scope);
                        },
                        function() {
                            try {
                                setTimeout(function() {
                                    ctrl.resetHeadPosition(true);
                                }, 10);
                            } catch (e) {}
                        }
                    );
                }

                if ($attrs.stSafeSrc) {
                    safeGetter = $parse($attrs.stSafeSrc);
                    $scope.$watch(
                        function() {
                            var safeSrc = safeGetter($scope);
                            return safeSrc && safeSrc.length ? safeSrc[0] : undefined;
                        },
                        function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                updateSafeCopy();
                            }
                        }
                    );
                    $scope.$watch(
                        function() {
                            var safeSrc = safeGetter($scope);
                            return safeSrc ? safeSrc.length : 0;
                        },
                        function(newValue, oldValue) {
                            if (newValue !== safeCopy.length) {
                                updateSafeCopy();
                            }
                        }
                    );
                    $scope.$watch(
                        function() {
                            return safeGetter($scope);
                        },
                        function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                tableState.pagination.start = 0;
                                updateSafeCopy();
                            }
                        }
                    );
                }

                /**
                 * sort the rows
                 * @param {Function | String} predicate - function or string which will be used as predicate for the sorting
                 * @param [reverse] - if you want to reverse the order
                 */
                this.sortBy = function sortBy(predicate, reverse) {
                    tableState.sort.predicate = predicate;
                    tableState.sort.reverse = reverse === true;

                    if (ng.isFunction(predicate)) {
                        tableState.sort.functionName = predicate.name;
                    } else {
                        delete tableState.sort.functionName;
                    }

                    tableState.pagination.start = 0;
                    return this.pipe();
                };

                /**
                 * search matching rows
                 * @param {String} input - the input string
                 * @param {String} [predicate] - the property name against you want to check the match, otherwise it will search on all properties
                 */
                this.search = function search(input, predicate) {
                    var predicateObject = tableState.search.predicateObject || {};
                    var prop = predicate ? predicate : "$";

                    input = ng.isString(input) ? input.trim() : input;
                    $parse(prop).assign(predicateObject, input);
                    // to avoid to filter out null value
                    if (!input) {
                        deepDelete(predicateObject, prop);
                    }
                    tableState.search.predicateObject = predicateObject;
                    tableState.pagination.start = 0;
                    return this.pipe();
                };

                /**
                 * this will chain the operations of sorting and filtering based on the current table state (sort options, filtering, ect)
                 */
                this.pipe = function pipe() {
                    var pagination = tableState.pagination;
                    var output;
                    filtered = tableState.search.predicateObject ? filter(safeCopy, tableState.search.predicateObject) : safeCopy;
                    if (tableState.sort.predicate) {
                        filtered = orderBy(filtered, tableState.sort.predicate, tableState.sort.reverse);
                    }
                    pagination.totalItemCount = filtered.length;
                    if (pagination.number !== undefined) {
                        pagination.numberOfPages = filtered.length > 0 ? Math.ceil(filtered.length / pagination.number) : 1;
                        pagination.start = pagination.start >= filtered.length ? (pagination.numberOfPages - 1) * pagination.number : pagination.start;
                        output = filtered.slice(pagination.start, pagination.start + parseInt(pagination.number));
                    }
                    displaySetter($scope, output || filtered);
                };

                this.displayRowsByPagination = function() {
                    //默认当前数据表长度和一致
                    displaySetter($scope, safeCopy);
                };

                /**
                 * select a dataRow (it will add the attribute isSelected to the row object)
                 * @param {Object} row - the row to select
                 * @param {String} [mode] - "single" or "multiple" (multiple by default)
                 */
                this.select = function select(row, mode, callback) {
                    var rows = copyRefs(displayGetter($scope));
                    var index = rows.indexOf(row);
                    var currentPageRows = displayGetter($scope);
                    var indexOfCurrentPage = currentPageRows.indexOf(row);
                    this.oCurrent.iCurrentRowIndex = index;
                    this.oCurrent.iCurrentPageIndex = indexOfCurrentPage;
                    if (callback) {
                        callback(index);
                    }
                    if (index !== -1) {
                        if (mode === "single") {
                            row.isSelected = row.isSelected !== true;
                            if (lastSelectedIndex > -1) {
                                //lastSelected.isSelected = false;
                                currentPageRows[lastSelectedIndex].isSelected = false;
                            }
                            lastSelected = row.isSelected === true ? row : undefined;
                            if (!lastSelected) {
                                lastSelectedIndex = -1;
                            } else {
                                lastSelectedIndex = this.oCurrent.iCurrentPageIndex;
                            }
                            this.oCurrent.bSelected = !!lastSelected;
                        } else {
                            rows[index].isSelected = !rows[index].isSelected;
                            rows[index].bChecked = rows[index].isSelected;
                            if (this.aCheckbox.length > 0) {
                                this.aCheckbox[indexOfCurrentPage].bChecked = rows[index].isSelected;
                            }
                        }
                    }
                };

                /**
                 * take a slice of the current sorted/filtered collection (pagination)
                 *
                 * @param {Number} start - start index of the slice
                 * @param {Number} number - the number of item in the slice
                 */
                this.slice = function splice(start, number) {
                    tableState.pagination.start = start;
                    tableState.pagination.number = number;
                    return this.pipe();
                };

                /**
                 * return the current state of the table
                 * @returns {{sort: {}, search: {}, pagination: {start: number}}}
                 */
                this.tableState = function getTableState() {
                    return tableState;
                };

                this.getFilteredCollection = function getFilteredCollection() {
                    return filtered || safeCopy;
                };

                this.getCurrentPageItems = function() {
                    return displayGetter($scope);
                };

                /**
                 * Use a different filter function than the angular FilterFilter
                 * @param filterName the name under which the custom filter is registered
                 */
                this.setFilterFunction = function setFilterFunction(filterName) {
                    filter = $filter(filterName);
                };

                /**
                 * Use a different function than the angular orderBy
                 * @param sortFunctionName the name under which the custom order function is registered
                 */
                this.setSortFunction = function setSortFunction(sortFunctionName) {
                    orderBy = $filter(sortFunctionName);
                };

                /**
                 * Usually when the safe copy is updated the pipe function is called.
                 * Calling this method will prevent it, which is something required when using a custom pipe function
                 */
                this.preventPipeOnWatch = function preventPipe() {
                    pipeAfterSafeCopy = false;
                };

                /*
                 * 新增勾选按钮框
                 * aCheckbox: {bChecked: false}
                 * oCheckAll: aCurrentPageCheckList是aCheckbox勾选中的索引列表
                 * */
                this.aCheckbox = [];
                this.oCheckAll = {
                    bChecked: false,
                    aCurrentPageCheckList: [],
                    aSelectRowCheckList: []
                };
                /*
                 * */
                this.oCurrent = {
                    iCurrentPageIndex: 0,
                    iCurrentRowIndex: 0,
                    bSelected: false
                };
            }
        ])
        .directive("stTable", function() {
            return {
                restrict: "A",
                controller: "stTableController",
                link: function(scope, element, attr, ctrl) {
                    if (attr.stSetFilter) {
                        ctrl.setFilterFunction(attr.stSetFilter);
                    }

                    if (attr.stSetSort) {
                        ctrl.setSortFunction(attr.stSetSort);
                    }

                    /*var iHeadPosition = $(element).find("thead").offset();
                    var iBodyPosition = $(element).find("tbody").offset();
                    var iFootPosition = $(element).find("tfoot").offset();
                    var iTableHeight = 0;
                    if ($(element).find("tfoot").length > 0){
                        iTableHeight = iFootPosition.top - iHeadPosition.top;
                    }*/

                    ctrl.resetHeadPosition = function(bNoScroll) {
                        if (!bNoScroll) {
                            $(element)
                                .parent()
                                .scrollTop(0);
                        }
                        $(element)
                            .find("thead th")
                            .css({
                                top:
                                    $(element)
                                        .parent()
                                        .scrollTop() + "px"
                            });
                    };

                    $(element)
                        .parent()
                        .scroll(function() {
                            $(element)
                                .find("thead th")
                                .css({
                                    top: $(this).scrollTop() + "px",
                                    position: "relative",
                                    "z-index": 2
                                });
                        });

                    /*if (iTableHeight > 45) {
                        $(element).parent().css({
                            "height": (iTableHeight) + "px",
                            "overflow-y": "auto"
                        });
                    }*/
                }
            };
        });

    ng.module("smart-table").directive("stSearch", [
        "stConfig",
        "$timeout",
        "$parse",
        function(stConfig, $timeout, $parse) {
            return {
                require: "^stTable",
                link: function(scope, element, attr, ctrl) {
                    var tableCtrl = ctrl;
                    var promise = null;
                    var throttle = attr.stDelay || stConfig.search.delay;
                    var event = attr.stInputEvent || stConfig.search.inputEvent;

                    attr.$observe("stSearch", function(newValue, oldValue) {
                        var input = element[0].value;
                        if (newValue !== oldValue && input) {
                            ctrl.tableState().search = {};
                            tableCtrl.search(input, newValue);
                        }
                    });

                    //table state -> view
                    scope.$watch(
                        function() {
                            return ctrl.tableState().search;
                        },
                        function(newValue, oldValue) {
                            var predicateExpression = attr.stSearch || "$";
                            if (newValue.predicateObject && $parse(predicateExpression)(newValue.predicateObject) !== element[0].value) {
                                element[0].value = $parse(predicateExpression)(newValue.predicateObject) || "";
                            }
                        },
                        true
                    );

                    $(element)
                        .parent()
                        .height();

                    // view -> table state
                    element.bind(event, function(evt) {
                        evt = evt.originalEvent || evt;
                        if (promise !== null) {
                            $timeout.cancel(promise);
                        }

                        promise = $timeout(function() {
                            tableCtrl.search(evt.target.value, attr.stSearch || "");
                            promise = null;
                        }, throttle);
                    });
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stSelectRow", [
        "stConfig",
        function(stConfig) {
            return {
                restrict: "A",
                require: "^stTable",
                link: function(scope, element, attr, ctrl) {
                    var mode = attr.stSelectMode || stConfig.select.mode;
                    scope.$parent[attr.stSelectRow] = ctrl.oCurrent;
                    //ctrl.oCurrent = scope.$parent[attr.stSelectRow];
                    element.bind("click", function() {
                        scope.$apply(function() {
                            ctrl.select(scope.row, mode, function(index){
                                scope.$parent.dpSelectRow = index;
                            });
                        });
                    });
                    ctrl.setLastIndex(ctrl.oCurrent.iCurrentPageIndex);

                    scope.$watch("row.isSelected", function(newValue) {
                        if (newValue === true) {
                            //console.log(1111);
                            var rows = scope.$parent.aTableList;
                            var index = rows.indexOf(scope.row);
                            element.addClass(stConfig.select.selectedClass);
                        } else {
                            element.removeClass(stConfig.select.selectedClass);
                        }
                    });
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stSort", [
        "stConfig",
        "$parse",
        "$timeout",
        function(stConfig, $parse, $timeout) {
            return {
                restrict: "A",
                require: "^stTable",
                link: function(scope, element, attr, ctrl) {
                    var predicate = attr.stSort;
                    var getter = $parse(predicate);
                    var index = 0;
                    var classAscent = attr.stClassAscent || stConfig.sort.ascentClass;
                    var classDescent = attr.stClassDescent || stConfig.sort.descentClass;
                    var stateClasses = [classAscent, classDescent];
                    var sortDefault;
                    var skipNatural = attr.stSkipNatural !== undefined ? attr.stSkipNatural : stConfig.sort.skipNatural;
                    var descendingFirst = attr.stDescendingFirst !== undefined ? attr.stDescendingFirst : stConfig.sort.descendingFirst;
                    var promise = null;
                    var throttle = attr.stDelay || stConfig.sort.delay;

                    if (attr.stSortDefault) {
                        sortDefault = scope.$eval(attr.stSortDefault) !== undefined ? scope.$eval(attr.stSortDefault) : attr.stSortDefault;
                    }

                    //view --> table state
                    function sort() {
                        if (descendingFirst) {
                            index = index === 0 ? 2 : index - 1;
                        } else {
                            index++;
                        }

                        var func;
                        predicate = ng.isFunction(getter(scope)) || ng.isArray(getter(scope)) ? getter(scope) : attr.stSort;
                        if (index % 3 === 0 && !!skipNatural !== true) {
                            //manual reset
                            index = 0;
                            ctrl.tableState().sort = {};
                            ctrl.tableState().pagination.start = 0;
                            func = ctrl.pipe.bind(ctrl);
                        } else {
                            func = ctrl.sortBy.bind(ctrl, predicate, index % 2 === 0);
                        }
                        if (promise !== null) {
                            $timeout.cancel(promise);
                        }
                        if (throttle < 0) {
                            func();
                        } else {
                            promise = $timeout(func, throttle);
                        }
                    }

                    element.bind("click", function sortClick() {
                        if (predicate) {
                            scope.$apply(sort);
                        }
                    });

                    if (sortDefault) {
                        index = sortDefault === "reverse" ? 1 : 0;
                        sort();
                    }

                    //table state --> view
                    scope.$watch(
                        function() {
                            return ctrl.tableState().sort;
                        },
                        function(newValue) {
                            if (newValue.predicate !== predicate) {
                                index = 0;
                                element.removeClass(classAscent).removeClass(classDescent);
                            } else {
                                index = newValue.reverse === true ? 2 : 1;
                                element.removeClass(stateClasses[index % 2]).addClass(stateClasses[index - 1]);
                            }
                        },
                        true
                    );
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stPagination", [
        "stConfig",
        function(stConfig) {
            return {
                restrict: "EA",
                require: "^stTable",
                scope: {
                    stItemsByPage: "=?",
                    stDisplayedPages: "=?",
                    stPageChange: "&"
                },
                templateUrl: function(element, attrs) {
                    if (attrs.stTemplate) {
                        return attrs.stTemplate;
                    }
                    return stConfig.pagination.template;
                },
                link: function(scope, element, attrs, ctrl) {
                    scope.stItemsByPage = scope.stItemsByPage ? +scope.stItemsByPage : stConfig.pagination.itemsByPage;
                    scope.stDisplayedPages = scope.stDisplayedPages ? +scope.stDisplayedPages : stConfig.pagination.displayedPages;

                    scope.currentPage = 1;
                    scope.pages = [];

                    function redraw() {
                        var paginationState = ctrl.tableState().pagination;
                        var start = 1;
                        var end;
                        var i;
                        var prevPage = scope.currentPage;
                        scope.totalItemCount = paginationState.totalItemCount;
                        scope.currentPage = Math.floor(paginationState.start / paginationState.number) + 1;

                        start = Math.max(start, scope.currentPage - Math.abs(Math.floor(scope.stDisplayedPages / 2)));
                        end = start + scope.stDisplayedPages;

                        if (end > paginationState.numberOfPages) {
                            end = paginationState.numberOfPages + 1;
                            start = Math.max(1, end - scope.stDisplayedPages);
                        }

                        scope.pages = [];
                        scope.numPages = paginationState.numberOfPages;

                        for (i = start; i < end; i++) {
                            scope.pages.push(i);
                        }

                        if (prevPage !== scope.currentPage) {
                            scope.stPageChange({ newPage: scope.currentPage });
                        }
                    }

                    //table state --> view
                    scope.$watch(
                        function() {
                            return ctrl.tableState().pagination;
                        },
                        redraw,
                        true
                    );

                    //scope --> table state  (--> view)
                    scope.$watch("stItemsByPage", function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            scope.selectPage(1);
                        }
                    });

                    scope.$watch("stDisplayedPages", redraw);

                    //view -> table state
                    scope.selectPage = function(page) {
                        if (page > 0 && page <= scope.numPages) {
                            ctrl.slice((page - 1) * scope.stItemsByPage, scope.stItemsByPage);
                        }
                    };

                    if (!ctrl.tableState().pagination.number) {
                        ctrl.slice(0, scope.stItemsByPage);
                    }
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stPipe", [
        "stConfig",
        "$timeout",
        function(config, $timeout) {
            return {
                require: "stTable",
                scope: {
                    stPipe: "="
                },
                link: {
                    pre: function(scope, element, attrs, ctrl) {
                        var pipePromise = null;

                        if (ng.isFunction(scope.stPipe)) {
                            ctrl.preventPipeOnWatch();
                            ctrl.pipe = function() {
                                if (pipePromise !== null) {
                                    $timeout.cancel(pipePromise);
                                }

                                pipePromise = $timeout(function() {
                                    scope.stPipe(ctrl.tableState(), ctrl);
                                }, config.pipe.delay);

                                return pipePromise;
                            };
                        }
                    },

                    post: function(scope, element, attrs, ctrl) {
                        ctrl.pipe();
                    }
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stCheckbox", [
        "stConfig",
        function(stConfig) {
            return {
                require: "^stTable",
                template: '<input type="checkbox" ng-model="oSingleCheck.bChecked" ng-change="checkAll()" />',
                scope: {
                    row: "=stCheckbox",
                    operateAll: "=?"
                },
                link: function(scope, element, attr, ctrl) {
                    stConfig.select.mode = "multiple";
                    var bOperateAll = false;
                    //用来控制checkbox
                    scope.oSingleCheck = { bChecked: false };

                    //属性在th里说明是全选
                    if (element[0].tagName === "TH") {
                        bOperateAll = true;
                    }
                    if (bOperateAll) {
                        //把全选信息传给父scope
                        scope.row = ctrl.oCheckAll;
                        scope.row.oCheck = scope.oSingleCheck;
                        scope.checkAll = function() {
                            var iLen = ctrl.aCheckbox.length;
                            //ctrl.oCheckAll.oCheck.bChecked = !ctrl.oCheckAll.oCheck.bChecked;
                            for (var i = 0; i < iLen; i++) {
                                ctrl.aCheckbox[i].bChecked = ctrl.oCheckAll.oCheck.bChecked;
                                scope.row.bChecked = ctrl.oCheckAll.oCheck.bChecked;
                            }
                            var aRows = ctrl.getCurrentPageItems();
                            iLen = aRows.length;
                            for (i = 0; i < iLen; i++) {
                                aRows[i].isSelected = ctrl.oCheckAll.oCheck.bChecked;
                                aRows[i].bChecked = ctrl.oCheckAll.oCheck.bChecked;
                            }
                        };
                    } else {
                        scope.checkAll = function() {};
                        //获取勾选状态
                        scope.oSingleCheck.bChecked = scope.operateAll ? !!scope.row : false;
                        //记录列表
                        ctrl.aCheckbox.push(scope.oSingleCheck);
                    }

                    scope.$on("$destroy", function() {
                        var indexOfCurrentPage = ctrl.aCheckbox.indexOf(scope.oSingleCheck);
                        ctrl.aCheckbox.splice(indexOfCurrentPage, 1);
                        var indexOfCheckbox = ctrl.oCheckAll.aCurrentPageCheckList.indexOf(indexOfCurrentPage);
                        ctrl.oCheckAll.aCurrentPageCheckList.splice(indexOfCheckbox, 1);
                        if (ctrl.oCheckAll.aCurrentPageCheckList.length == 0) {
                            ctrl.oCheckAll.bChecked = false;
                            ctrl.oCheckAll.oCheck.bChecked = false;
                        }
                        /*if (ctrl.aCheckbox.length == 0) {
                            ctrl.oCheckAll.bChecked = false;
                            {
                                bChecked: false,
                                aCurrentPageCheckList: []
                            };
                        }*/
                        element.unbind();
                        if (scope.listenWatch) {
                            scope.listenWatch();
                        }
                        element.remove();
                    });
                    scope.listenWatch = scope.$watch("oSingleCheck.bChecked", function(newValue, oldValue) {
                        var iLen = ctrl.aCheckbox.length;
                        //有时候强制digest会触发，相同就不处理了
                        if (newValue === oldValue) {
                            return;
                        }
                        //只有改动列表里的勾选进行处理，如果全选放这里会影响到其他行
                        if (!bOperateAll) {
                            //判断是否全部勾选，全部则修改全选按钮
                            var bCheckAll = true;
                            ctrl.oCheckAll.aCurrentPageCheckList.length = 0;
                            for (var i = 0; i < iLen; i++) {
                                if (!ctrl.aCheckbox[i].bChecked) {
                                    bCheckAll = false;
                                } else {
                                    ctrl.oCheckAll.aCurrentPageCheckList.push(i);
                                }
                            }
                            //scope.row.bChecked = newValue;
                            ctrl.oCheckAll.oCheck.bChecked = bCheckAll;
                        }
                        //element.prop("checked", newValue);
                    });
                }
            };
        }
    ]);

    ng.module("smart-table").directive("stPaginationExtend", [
        "stConfig",
        "$compile",
        "$timeout",
        function(stConfig, $compile, $timeout) {
            return {
                restrict: "EA",
                require: "^stTable",
                scope: {
                    lan: "=?",
                    conf: "=?"
                },
                link: function(scope, element, attrs, ctrl) {
                    scope.oPagingConf = {
                        //翻页配置项
                        currentPage: 1,
                        totalItems: 0,
                        itemsPerPage: 20, //当前页显示条数
                        pagesLength: 15,
                        perPageOptions: [20, 50, 100],
                        onChange: function(iPage) {}
                    };
                    scope.oLan = scope.lan;
                    angular.extend(scope.oPagingConf, scope.conf);

                    var fPageChange = scope.oPagingConf.onChange;

                    var pipePromise = null;
                    var bIsSetChange = scope.conf && ng.isFunction(scope.conf.onChange);

                    if (bIsSetChange) {
                        //ctrl.preventPipeOnWatch();
                        ctrl.pipe = function() {
                            ctrl.displayRowsByPagination();
                            //scope.$digest();
                            /*if (pipePromise !== null) {
                                $timeout.cancel(pipePromise)
                            }

                            pipePromise = $timeout(function () {
                                //fPageChange(ctrl.tableState(), ctrl);

                            }, stConfig.pipe.delay);*/
                            return pipePromise;
                        };
                    }

                    scope.oPagingConf.onChange = function(iPage) {
                        if (!angular.isUndefined(iPage)) {
                            initTableData();
                            if (bIsSetChange) {
                                try {
                                    var oPagination = ctrl.tableState().pagination;
                                    fPageChange(iPage);
                                    oPagination.totalItemCount = scope.oPagingConf.iTotalItems;
                                    oPagination.numberOfPages = Math.ceil(oPagination.totalItemCount / scope.oPagingConf.iItemsPerPage);
                                } catch (e) {}
                                redraw();
                            }
                            scope.selectPage(iPage);
                            /*try {
                                fPageChange(iPage);
                            } catch(e){}*/
                        }
                    };
                    scope.stItemsByPage = scope.oPagingConf.iItemsPerPage;
                    scope.stDisplayedPages = scope.oPagingConf.stDisplayedPages;
                    //scope.stPageChange = scope.oPagingConf.onChange;

                    scope.currentPage = scope.oPagingConf.iCurrentPage;
                    scope.pages = [];
                    ctrl.tableState().pagination.totalItemCount = scope.oPagingConf.iTotalItems;

                    function initTableData() {
                        var aRows = ctrl.getCurrentPageItems();
                        var iLen = aRows.length;
                        try {
                            for (var i = 0; i < iLen; i++) {
                                aRows[i].isSelected = false;
                            }
                            ctrl.oCheckAll.bChecked = false;
                            ctrl.oCheckAll.aCurrentPageCheckList.length = 0;
                            ctrl.oCheckAll.oCheck.bChecked = false;
                        } catch (e) {}
                    }

                    function redraw() {
                        var paginationState = ctrl.tableState().pagination;
                        var start = 1;
                        var end;
                        var i;
                        var prevPage = scope.currentPage;
                        scope.totalItemCount = paginationState.totalItemCount;
                        scope.currentPage = Math.floor(paginationState.start / paginationState.number) + 1;

                        //更新分页参数
                        scope.oPagingConf.iTotalItems = scope.totalItemCount;
                        scope.oPagingConf.iCurrentPage = scope.currentPage;

                        start = Math.max(start, scope.currentPage - Math.abs(Math.floor(scope.stDisplayedPages / 2)));
                        end = start + scope.stDisplayedPages;

                        if (end > paginationState.numberOfPages) {
                            end = paginationState.numberOfPages + 1;
                            start = Math.max(1, end - scope.stDisplayedPages);
                        }

                        scope.pages = [];
                        scope.numPages = paginationState.numberOfPages;

                        for (i = start; i < end; i++) {
                            scope.pages.push(i);
                        }

                        //setTimeout(function(){
                        try {
                            setTimeout(function() {
                                ctrl.resetHeadPosition();
                            }, 10);
                        } catch (e) {}

                        //}, 10);
                        /*if (prevPage !== scope.currentPage) {
                            scope.stPageChange({newPage: scope.currentPage});
                        }*/
                    }

                    //table state --> view
                    scope.$watch(
                        function() {
                            return ctrl.tableState().pagination;
                        },
                        redraw,
                        true
                    );

                    //scope --> table state  (--> view)
                    scope.$watch("stItemsByPage", function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            scope.selectPage(1);
                        }
                    });

                    scope.$watch("stDisplayedPages", redraw);
                    scope.$watch("oPagingConf.iItemsPerPage", function() {
                        scope.stItemsByPage = scope.oPagingConf.iItemsPerPage;
                    });
                    scope.$watch("oPagingConf.stDisplayedPages", function() {
                        scope.stDisplayedPages = scope.oPagingConf.iCurrentPage;
                    });

                    //view -> table state
                    scope.selectPage = function(page) {
                        if (page > 0 && page <= scope.numPages) {
                            ctrl.slice((page - 1) * scope.stItemsByPage, scope.stItemsByPage);
                        }
                    };

                    /*scope.$watch('oPagingConf.iTotalItems', function(to) {
                        ctrl.tableState().pagination.totalItemCount = parseInt(to, 10);
                    });*/

                    if (!ctrl.tableState().pagination.number) {
                        ctrl.slice(0, scope.stItemsByPage);
                    }
                    var oPagination = angular.element('<div pagination lan="oLan" conf="oPagingConf"></div>');
                    $compile(oPagination)(scope);
                    element.append(oPagination);
                }
            };
        }
    ]);
})(angular);
