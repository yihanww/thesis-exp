/**
 * jspsych-survey-text
 * a jspsych plugin for free response survey questions
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 */

import jsPsych from "jspsych";
import "lodash";

const face_description_trial = (function() {
  let plugin = {};

  plugin.info = {
    name: "face-description-trial",
    description: "",
    parameters: {
      questions: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: "Questions",
        default: undefined,
        nested: {
          prompt: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: "Prompt",
            default: undefined,
            description: "Prompt for the subject to response",
          },
          placeholder: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: "Value",
            default: "",
            description: "Placeholder text in the textfield.",
          },
          rows: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: "Rows",
            default: 1,
            description: "The number of rows for the response text box.",
          },
          columns: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: "Columns",
            default: 40,
            description: "The number of columns for the response text box.",
          },
          required: {
            type: jsPsych.plugins.parameterType.BOOL,
            pretty_name: "Required",
            default: true,
            description: "Require a response",
          },
          name: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: "Question Name",
            default: "",
            description:
              "Controls the name of data values associated with this question",
          },
        },
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Preamble",
        default: null,
        description: "HTML formatted string to display at the top of the page.",
      },
      image: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Image",
        default: null,
        description:
          "HTML image to display at the left of the page to the right of the questions.",
      },
      min_length: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Minimum length",
        default: 50,
        description: "Minimum character length of each response.",
      },
      max_length: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Maximum length",
        default: undefined,
        description: "Maximum character length of each response.",
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label",
        default: "Next",
        description: "The text that appears on the button to finish the trial.",
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    let min_length_string = "";
    let max_length_string = "";
    // Load custom CSS
    const css_block = jsPsych.pluginAPI.loadCSS(
      `.row { max-width: 1000px; margin: auto; }`,
    );

    const num_questions = trial.questions.length;
    for (const i of _.range(num_questions)) {
      if (typeof trial.questions[i].rows == "undefined") {
        trial.questions[i].rows = 1;
      }

      if (typeof trial.questions[i].columns == "undefined") {
        trial.questions[i].columns = 40;
      }

      if (typeof trial.questions[i].value == "undefined") {
        trial.questions[i].value = "";
      }
    }

    let html = "";
    // show preamble text
    if (trial.preamble !== null) {
      html +=
        '<div id="jspsych-survey-text-preamble" class="jspsych-survey-text-preamble">' +
        trial.preamble +
        "</div>";
    }

    // Set up grid; image on left, survey questions on right
    html += `<div class="row">`;
    html += `<div class="col-md-6">${trial.image}</div>`;
    html += `<div class="col-md-6">`;
    // start form
    html += '<form id="jspsych-survey-text-form">';

    // generate question order
    let question_order = [];
    for (const i of _.range(num_questions)) {
      question_order.push(i);
    }
    if (trial.randomize_question_order) {
      question_order = jsPsych.randomization.shuffle(question_order);
    }

    if (trial.min_length > 0) {
      min_length_string = `minlength="${trial.min_length}"`;
    }

    if (trial.max_length) {
      max_length_string = `maxlength="${trial.max_length}"`;
    }

    // add questions
    for (const i of _.range(num_questions)) {
      let question = trial.questions[question_order[i]];
      let question_index = question_order[i];
      html +=
        '<div id="jspsych-survey-text-' +
        question_index +
        '" class="jspsych-survey-text-question">';
      if (question.prompt) {
        html += '<p class="jspsych-survey-text">' + question.prompt + "</p>";
      }

      let autofocus = i === 0 ? "autofocus" : "";
      let req = question.required ? "required" : "";
      if (question.rows == 1) {
        html +=
          '<div class="form-group col-xs-3 mb-3">' +
          '<input type="text" class="form-control" id="input-' +
          question_index +
          '"  name="#jspsych-survey-text-response-' +
          question_index +
          '" data-name="' +
          question.name +
          '" size="' +
          question.columns +
          '" ' +
          autofocus +
          " " +
          req +
          ' placeholder="' +
          question.placeholder +
          '"></input>' +
          "</div>";
      } else {
        html +=
          '<textarea id="input-' +
          question_index +
          '" name="#jspsych-survey-text-response-' +
          question_index +
          '" data-name="' +
          question.name +
          '" cols="' +
          question.columns +
          '" rows="' +
          question.rows +
          '" ' +
          autofocus +
          " " +
          req +
          " " +
          min_length_string +
          " " +
          max_length_string +
          " " +
          ' placeholder="' +
          question.placeholder +
          '"></textarea>';
      }
      html += "</div>";
    }

    // add submit button
    html +=
      '<input type="submit" id="jspsych-survey-text-next" class="btn btn-primary btn-lg jspsych-survey-text" value="' +
      trial.button_label +
      '"></input>';

    html += "</form>";
    html += "</div>";
    html += "</div>";
    display_element.innerHTML = html;

    // backup in case autofocus doesn't work
    display_element.querySelector("#input-" + question_order[0]).focus();

    display_element
      .querySelector("#jspsych-survey-text-form")
      .addEventListener("submit", function(e) {
        e.preventDefault();
        // measure response time
        var endTime = performance.now();
        var response_time = endTime - startTime;

        // create object to hold responses
        var question_data = {};

        for (var index = 0; index < trial.questions.length; index++) {
          var id = "Q" + index;
          var q_element = document
            .querySelector("#jspsych-survey-text-" + index)
            .querySelector("textarea, input");
          var val = q_element.value;
          var name = q_element.attributes["data-name"].value;
          if (name == "") {
            name = id;
          }
          var obje = {};
          obje[name] = val;
          Object.assign(question_data, obje);
        }
        // save data
        var trialdata = {
          rt: response_time,
          responses: question_data,
        };

        display_element.innerHTML = "";

        // next trial
        jsPsych.pluginAPI.unloadCSS(css_block);
        jsPsych.finishTrial(trialdata);
      });

    var startTime = performance.now();
  };

  return plugin;
})();

export default face_description_trial;
