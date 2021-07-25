// ==UserScript==
// @name         RandomPlayVList
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Random play parts within a video with multiple lists.
// @author       Ken Wang
// @match        https://www.bilibili.com/video/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js
// @require      https://raw.githubusercontent.com/weatherstar/switch/master/dist/switch.js
// @resource     switchCSS https://raw.githubusercontent.com/weatherstar/switch/master/dist/switch.css
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/kenmingwang/BiliBili-RandomPlayParts/main/RandomPlayVList.js
// ==/UserScript==
var newCSS = GM_getResourceText("switchCSS");
GM_addStyle(newCSS);


var total_parts = 0;

var current_part = 0;

// Make sure not to replay the last 0.1*total_parts videos.
var played_part = [];

// Inits to 0.1*total_parts
var replay_limit;

// Stores all part ref, can mock click it to route.
var parts_ref;

// Switch ref
var toggle_switch;

// Helper logger
function log(str) {
  console.log("[RandomPlayVList]: " + str);
}


function init() {
  // string in format of (xxx/yyy) where xxx is current part and yyy is total part
  total_parts = $("span.cur-page").text().replace(/\(|\)/g, '').split("/");
  if(total_parts.length < 2){
    log("Not a list video. No need to init random play.");
    return;
  }

  current_part = parseInt(total_parts[0]);
  total_parts = parseInt(total_parts[1]);
  if(total_parts < 5){
    log("No enough parts. No need to init random play.");
    return;
  }
  replay_limit = Math.floor(total_parts * 0.1);

  played_part.push(current_part);

  log("afterAjax Started.");
  initAfterAjax();

  // Event bindings
  $("video").off("ended");
  $("video").on("ended", onVideoEnded);

  //ref: https://github.com/Attect/Bilibili-HTML5-Random-Play
  $(".bilibili-player-video-btn-next").off("click");
  $(".bilibili-player-video-btn-next").on("click", function () {
    if (randomStatus) {
      playNextRandomPart();
    } else {
      window.player.next();
    }
  });
  log("afterAjax Ended.");
}

// Wait for ajax data for detailed parts
function initAfterAjax() {
  setTimeout(function () {
    parts_ref = $("ul.list-box li a");
    if (parts_ref.length > 0) {
      log("Parts loaded: " + parts_ref.length);
      log("Current part: " + current_part);
      log("Replay limit: " + replay_limit); 

      switcherShow();

    } else {
      initAfterAjax();
    }
  }, 250);
}

function onVideoEnded() {
  log("onVideoEnded triggered.");
  if (toggle_switch.getChecked())
    playNextRandomPart();
}

function Random(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

// Generates random part number and play accordingly.
function playNextRandomPart() {
  var p_random = Random(1, total_parts);
  while (played_part.includes(p_random)) {
    p_random = Random(1, total_parts);
  }
  played_part.push(p_random);
  if (played_part.length >= 10)
    played_part.shift();

  playPart(p_random);
}

function playPart(part) {
  parts_ref[part].firstElementChild.click();
}

function switcherShow() {
  // Switch component holder
  var switcher = $("<input type=\"checkbox\" class=\"switch-success\" />");
  switcher.insertBefore($(".range-box"));

  // From example in https://github.com/weatherstar/switch
  var el = document.querySelector('.switch-success');
  toggle_switch = new Switch(el,
    {
      size: 'small',
      offSwitchColor: '#ccc'
    });
  $(".switch-small").css({ 'margin-left': '0.5rem' });
  $("small").text("随");
  $("small").click(switchOnChange);
}

function switchOnChange() {
  log(toggle_switch.getChecked());

  // Disable default auto-play before switch on
  if (!toggle_switch.getChecked()) {
    if ($(".switch-button.on").length != 0) {
      alert("请先关闭自动连播.\n随机选项开了以后会自动禁用自动连播，关闭选项即可恢复。");
      toggle_switch.toggle(); // Hacking code to revert the upcoming switch-on
      return;
    }
    postCheckAutoPlay();
  }

  postCheckAutoPlay();
}

function postCheckAutoPlay() {
  if (!toggle_switch.getChecked())
    $(".next-button").css({ "pointer-events": "none" });
  else
    $(".next-button").css({ "pointer-events": "" });
}

(function () {
  "use strict";
  $('document').ready(function () {
    init();
  });
})();