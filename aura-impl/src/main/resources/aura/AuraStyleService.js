/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*jslint sub: true */
/**
 * @description The Aura Style Service, accessible using <b><code>$A.styleService</code></b>.
 *              Dynamically loads and applies themed CSS.
 * @constructor
 */
var AuraStyleService = function() {
    var style = new Aura.Utils.Style(); // util for adding and removing <style> elements
    var added = []; // keep track of <style> elements added to head

    var styleService = {
        /**
         * Loads CSS from the server with the given theme applied.
         * <p>
         * The current application's CSS is loaded from the server and only includes
         * overrides for the CSS that reference theme vars from the specified theme. This
         * CSS is then placed into a new style element and attached to the DOM.
         * <p>
         * In addition to the application's CSS (as determined by the
         * application's dependency graph), this will also include any client
         * loaded StyleDefs (i.e., any dynamically loaded components with
         * styles, that are not in the application's dependency graph). Client
         * loaded StyleDefs will be appended after the standard application CSS.
         * Extra StyleDefs to load may be specified through the config object,
         * which will be appended last.
         * <p>
         * Multiple calls to this method are cumulative, unless
         * <code>config.replaceExisting</code> is specified as true.
         *
         * @public
         * @memberOf AuraStyleService
         *
         * @param {string} theme
         *          The theme descriptor, e.g., <code>"myNamespace:myTheme"</code>.
         * @param {Object=} config
         *          The optional configuration object.
         * @param {boolean} [config.replaceExisting=true]
         *          Specify true to replace all previously applied styles, false to append.
         * @param {string[]} [config.extraStyles]
         *          Specify any extra StyleDef descriptors to include.
         * @param {boolean} [config.storable=true]
         *          Specify whether the server action is storable. If true, the results
         *          may be retrieved from a cache when given the same parameters. You
         *          may want to specify false if applying a <em>MapProvider</em> theme.
         * @param {function} [config.callback]
         *          Callback function to invoke once the style element has been appended to the page.
         * @param {function} [config.customHandler]
         *          Callback function that will be invoked with the themed CSS. If this function is
         *          specified, the CSS will not be automatically appended to the page as usual.
         *          Certain other config options may no longer be applicable. If you place the styles
         *          into the DOM, be aware that subsequent calls to this method that do not specify this
         *          option may not properly override everything depending on where in the DOM you placed
         *          the styles. Also note that the <code>replaceExisting</code> param will not handle
         *          any styles you attach to the DOM manually.
         */
        applyTheme: function(theme, config) {
            $A.assert(!$A.util.isUndefinedOrNull(theme), "applyTheme() cannot be given a null or undefined theme argument");
            styleService.applyThemes([theme], config);
        },

        /**
         * Loads CSS from the server with the given themes applied.
         * <p>
         * The current application's CSS is loaded from the server and only includes
         * overrides for the CSS that reference theme vars from the specified themes.
         * This CSS is then placed into a new style element and attached to the DOM.
         * <p>
         * In addition to the application's CSS (as determined by the
         * application's dependency graph), this will also include any client
         * loaded StyleDefs (i.e., any dynamically loaded components with
         * styles, that are not in the application's dependency graph). Client
         * loaded StyleDefs will be appended after the standard application CSS.
         * Extra StyleDefs to load may be specified through the config object,
         * which will be appended last.
         * <p>
         * Multiple calls to this method are cumulative, unless
         * <code>config.replaceExisting</code> is specified as true.
         *
         * @public
         * @memberOf AuraStyleService
         *
         * @param {string[]} themes
         *          The theme descriptors, e.g., <code>["myNamespace:myTheme", "myNamespace:myTheme2"]</code>.
         * @param {Object=} config
         *          The optional configuration object.
         * @param {boolean} [config.replaceExisting=true]
         *          Specify true to replace all previously applied styles, false to append.
         * @param {string[]} [config.extraStyles]
         *          Specify any extra StyleDef descriptors to include.
         * @param {boolean} [config.storable=true]
         *          Specify whether the server action is storable. If true, the results
         *          may be retrieved from a cache when given the same parameters. You
         *          may want to specify false if applying a <em>MapProvider</em> theme.
         * @param {function} [config.callback]
         *          Callback function to invoke once the style element has been appended to the page.
         * @param {function} [config.customHandler]
         *          Callback function that will be invoked with the themed CSS. If this function is
         *          specified, the CSS will not be automatically appended to the page as usual.
         *          Certain other config options may no longer be applicable. If you place the styles
         *          into the DOM, be aware that subsequent calls to this method that do not specify this
         *          option may not properly override everything depending on where in the DOM you placed
         *          the styles. Also note that the <code>replaceExisting</code> param will not handle
         *          any styles you attach to the DOM manually.
         */
        applyThemes: function(themes, config) {
            $A.assert($A.util.isArray(themes), "applyThemes() expects the 'themes' arg to be an array of strings");
            config = config || {};

            $A.run(function() {
                $A.Perf.mark("applyThemes");

                var action = $A.get("c.aura://DynamicStylingController.applyThemes");

                action.setParams({
                    "themes": themes,
                    "extraStyles": config["extraStyles"] || []
                });

                // default storable true
                if ($A.util.isUndefined(config["storable"]) || config["storable"]) {
                    action.setStorable();
                }

                action.setCallback(this, function(a) {
                    if (a.getState() === "SUCCESS") {
                        // if custom handler is specified, give it the CSS and do nothing else
                        if ($A.util.isFunction(config["customHandler"])) {
                            config["customHandler"](a.getReturnValue());
                            return;
                        }

                        var node = style.apply(a.getReturnValue());

                        // default is to replace existing unless specified false
                        if ($A.util.isUndefinedOrNull(config["replaceExisting"]) || $A.util.getBooleanValue(config["replaceExisting"]) === true) {
                            styleService.removeThemes();
                            added = [node];
                        } else {
                            added.push(node);
                        }
                    } else {
                        var errors = a.getError();
                        if (errors && errors[0] && errors[0].message) {
                            $A.error(errors[0].message);
                        } else {
                            $A.error("Unable to apply theme, action state = " + state);
                        }
                    }

                    $A.Perf.endMark("applyThemes");

                    if ($A.util.isFunction(config["callback"])) {
                        config["callback"]();
                    }
                });

                $A.clientService.enqueueAction(action);
            }, "applyThemes");
        },

        /**
         * Removes all style elements previously added through this service.
         *
         * @public
         * @memberOf AuraStyleService
         */
        removeThemes: function() {
            var head = style.getHead();
            for (var i = 0, len = added.length; i < len; i++) {
                head.removeChild(added[i]);
            }
            added = [];
        }
    };

    // #include aura.AuraStyleService_export

    return styleService;
};

Aura.Services.AuraStyleService = AuraStyleService;