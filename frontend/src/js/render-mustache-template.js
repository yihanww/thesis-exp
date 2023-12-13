/** (July 2019, Stefan Uddenberg)
The html-plugin will load and display an external html page, rendered with Mustache. To proceed to the next, the
user might either press a button on the page or a specific key. Afterwards, the page get hidden and
the plugin will wait of a specified time before it proceeds. Created by editing the external-html plugin.

*/
import Mustache from "mustache";
import jsPsych from "jspsych";

const render_mustache_template = (function () {
  var plugin = {};

  plugin.info = {
    name: "render-mustache-template",
    description: "",
    parameters: {
      url: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "URL",
        default: undefined,
        description: "The url of the external html page",
      },
      cont_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Continue key",
        default: null,
        description: "The key to continue to the next page.",
      },
      cont_btn: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Continue button",
        default: null,
        description: "The button to continue to the next page.",
      },
      check_fn: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        pretty_name: "Check function",
        default: function () {
          return true;
        },
        description: "",
      },
      force_refresh: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Force refresh",
        default: false,
        description: "Refresh page.",
      },
      // if execute_Script == true, then all javascript code on the external page
      // will be executed in the plugin site within your jsPsych test
      execute_script: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Execute scripts",
        default: false,
        description:
          "If true, JS scripts on the external html file will be executed.",
      },
      render_data: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: "Mustache data",
        default: {},
        description: "The data to be rendered with Mustache.",
      },
      tags: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: "Mustache tags",
        array: true,
        default: ["{{", "}}"],
        description: "The tags used to parse Mustache variables.",
      },
      on_load_complete_callbacks: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: "Callbacks on load completion",
        default: {},
        description:
          "The callback functions to execute on successful load of the template.",
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    let keyboardListener;
    let {
      url,
      force_refresh,
      execute_script,
      cont_btn,
      cont_key,
      on_load_complete_callbacks,
      render_data,
      tags,
      // cannot get check_fn because it loses `this` context.
    } = trial;
    if (force_refresh) {
      url += "?time=" + new Date().getTime();
    }

    load(display_element, url, render_data, tags, function () {
      function finish() {
        if (trial.check_fn && !trial.check_fn(display_element)) {
          return;
        }
        if (cont_key) {
          // kill keyboard listeners
          jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }
        const trial_data = {
          rt: new Date().getTime() - t0,
          url: trial.url,
        };
        display_element.innerHTML = "";
        jsPsych.finishTrial(trial_data);
      }

      const t0 = new Date().getTime();
      for (let [key, arr] of Object.entries(on_load_complete_callbacks)) {
        let func = arr.shift();
        let params = [...arr];
        func(...params);
      }

      // by default, scripts on the external page are not executed with XMLHttpRequest().
      // To activate their content through DOM manipulation, we need to relocate all script tags
      if (execute_script) {
        for (const scriptElement of display_element.getElementsByTagName(
          "script",
        )) {
          const relocatedScript = document.createElement("script");
          relocatedScript.text = scriptElement.text;
          scriptElement.parentNode.replaceChild(relocatedScript, scriptElement);
        }
      }

      if (cont_btn) {
        display_element
          .querySelector(`#${cont_btn}`)
          .addEventListener("click", finish);
      }
      if (cont_key) {
        keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: finish,
          valid_responses: [cont_key],
          rt_method: "date",
          persist: false,
          allow_held_key: false,
        });
      }
    });
  };

  // helper to load via XMLHttpRequest
  function load(element, file, data, tags, callbackFunc) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", file, true);
    xmlhttp.onload = function () {
      if (xmlhttp.status == 200 || xmlhttp.status == 0) {
        // Check if loaded
        const template = xmlhttp.responseText;
        const rendered_template = Mustache.render(template, data, {}, tags);
        element.innerHTML = rendered_template;
        // console.log("template: ", template);
        // console.log("rendered template: ", rendered_template);
        callbackFunc();
      }
    };
    xmlhttp.send();
  }

  return plugin;
})();

export default render_mustache_template;
