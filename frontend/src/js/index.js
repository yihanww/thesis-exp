// * JS
import instructions_trial from "jspsych/plugins/jspsych-instructions";
import external_html from "jspsych/plugins/jspsych-external-html";
import render_mustache_template from "./render-mustache-template";
import image_slider_response from "./image-slider-response";
import circular_slider_image_morpher from "./circular-slider-image-morpher";
import keypress_duration_trial from "./keypress-duration-trial";
import face_description_trial from "./face-description-trial";
import {
  generateCompletionCode,
  generateInstructionsWithMustache,
  getCondition,
  getExperimentInfo,
  getWorkerInfo
} from "./utils";
import { getStimuli, getMorphStimuli } from "./stimuli";
import { generateRatingTrials, generateDescriptionTrials } from "./trials";
import runExperiment from "./experiment";

// * CSS
import "jspsych/css/jspsych.css";
import "bootswatch/dist/flatly/bootstrap.min.css";
import "@dashboardcode/bsmultiselect/dist/css/BsMultiSelect.min.css";
import "../css/index.css";

(async function () {
  // Can set information for the frontend in optional client.env -- see webpack.config.js

  const worker_info = getWorkerInfo();

  console.log("!worker_info.PROLIFIC_PID", !worker_info.PROLIFIC_PID);

  if (!worker_info.PROLIFIC_PID && !worker_info.workerId && !worker_info.participantId) {
    alert(
      "We couldn't find your worker ID. Please try clicking the link again.",
    );
    return;
  }


  let configuration_info = await getExperimentInfo({ worker_info });
  let {
    debug_mode,
    estimated_task_duration,
    compensation,
    experiment_title,
    experiment_name,
    version_date,
    open_tags,
    close_tags,
    getCondition,
    stimulus_width,
    slider_width,
    slider_amount_visible,
    num_stimuli
  } = configuration_info;




  // * Constants
  let logrocket_id;
  const intertrial_interval = 100; // in ms; bug in jspsych 6.0.x where this param isn't respected at jsPsych.init
  const tags = [open_tags, close_tags];
  const image_dir = "src/images/AllPic"; // `src/images/06F-21M/${condition}`; // "src/images/jpg";
  const example_image = "src/images/examples/example_faces.jpg";
  const extension = ".jpeg";
  const condition = "competent";
  const completion_code = generateCompletionCode("exa", "mple");
  const reading_speed = 250;
  const reading_speed_button_delay_type = "none"; // enable | show | none
  const show_slider_delay = 500;
  const preload_stimuli = [example_image];
  const trial_types = [
    instructions_trial,
    external_html,
    render_mustache_template,
    image_slider_response,
    circular_slider_image_morpher,
    keypress_duration_trial,
    face_description_trial,
  ];

  const pages = [
    `<p class="text-left instructions">
    In this study, you will see a series of faces.
    The images below are there to give you an idea
    of how varied these faces can be.
    You will be asked to rate each face in terms of
    how ${condition} they appear to be.
    (You can make your response using a slider that
    appears below the image.)
    We are interested in your immediate,
    gut reaction to the images. There are no
    right or wrong responses.
    </p>
    <div class="container text-center my-2">
      <img id="exampleImage" class="instructions-image text-center" src="${example_image}"/>
    </div>`,
  ];

  const instructions = await generateInstructionsWithMustache({
    pages,
    tags,
    post_trial_gap: intertrial_interval,
    reading_speed_button_delay_type,
    reading_speed,
  });


async function generateTrials() {
  let stimuli = getStimuli({ image_dir, num_stimuli: 150, extension });
  let block1 = stimuli.slice(0, 42);
  let block2 = stimuli.slice(42, 84);
  let block3 = stimuli.slice(84, 126);
  let repeatPics = stimuli.slice(126);
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
  }
}
  shuffle(block1);
  shuffle(block2);
  shuffle(block3);
  shuffle(repeatPics);
  let finalPictures = [...block1, ...block2, ...block3, ...repeatPics];

  return generateRatingTrials({
    type: image_slider_response.info.name,
    stimuli: finalPictures,
    stimulus_width,
    slider_width,
    condition,
    slider_amount_visible,
    show_slider_delay,
    labels: [`Not at all ${condition}`, `Extremely ${condition}`],
    prompt: `<h1 class="text-center mt-2 mb-4">How ${condition} does this face look?</h1>`,
    response_ends_trial: true,
    experiment_phase: "main",
    post_trial_gap: intertrial_interval,
  });
}

  runExperiment({
    debug_mode,
    tags,
    compensation,
    worker_info,
    preload_stimuli,
    experiment_name,
    experiment_title,
    condition,
    logrocket_id,
    trial_types,
    instructions,
    version_date,
    intertrial_interval, // in ms
    compensation, // str: in dollars
    estimated_task_duration, // str: in min
    completion_code,
    generateTrials,
  });
})();
