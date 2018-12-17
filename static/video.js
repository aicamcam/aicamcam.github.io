// Grab elements, create settings, etc.
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var video = document.getElementById('local-video');
var object_detection_model = null;
var isObjectDetectionRunning = false;
var isObjectDetectionShowing = false;
var isRecordingRunning = false;
var isSmartRecordingEnabled = false;
var isAutoDownloadRunning = false;
var isNavOpend = false;

init()

// Utils
function init() {
    start_webcam()
    setup_fullscreen();
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
};

function trace(text) {
    // This function is used for logging.
    if (text[text.length - 1] === '\n') {
      text = text.substring(0, text.length - 1);
    }
    if (window.performance) {
      var now = (window.performance.now() / 1000).toFixed(3);
      console.log(now + ': ' + text);
    } else {
      console.log(text);
    }
};

function format_date(date) {
    var d = new Date(date);
    year = d.getFullYear();
    month = '' + (d.getMonth() + 1);
    day = '' + d.getDate();
    hour = '' + d.getHours();
    minute = '' + d.getMinutes();
    second = '' + d.getSeconds();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return year+'/'+month+'/'+day+'_'+hour+':'+minute+':'+second;
};

function format_date_flat(date) {
    var d = new Date(date);
    year = d.getFullYear();
    month = '' + (d.getMonth() + 1);
    day = '' + d.getDate();
    hour = '' + d.getHours();
    minute = '' + d.getMinutes();
    second = '' + d.getSeconds();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return year+month+day+hour+minute+second;
};

///
/// LOADER ///
function open_loader(text) {
    loader_modal = document.getElementById("loader_modal");
    document.getElementById("loader_message").innerHTML = text;
    loader_modal.style.display = "block";
}

function close_loader() {
    loader_modal = document.getElementById("loader_modal");
    loader_modal.style.display = "none";
}
///
function openNav() {
    document.getElementById("sidenav").style.width = "250px";
    //document.getElementById("sidenav").removeAttribute('hidden');
    document.getElementById("sidenav-icon").setAttribute('hidden', "");
    document.getElementById("mini-video-counter").setAttribute('hidden', "");
    isNavOpend = true;
}

function closeNav() {
    document.getElementById("sidenav").style.width = "0";
    //document.getElementById("sidenav").setAttribute('hidden', "");
    document.getElementById("sidenav-icon").removeAttribute('hidden');
    document.getElementById("mini-video-counter").removeAttribute('hidden');
    isNavOpend = false;
}

function mini_video_counter_update() {
    boxes = document.getElementById("mini-video-boxes");
    count = boxes.children.length;
    console.log(count)
    document.getElementById("mini-video-counter").innerText = count;
}

///
// Elements for taking the snapshot
this.icons_ = document.getElementById("icons")
  
function activate_(element) {
    element.classList.add('active');
};
  
function deactivate_(element) {
    element.classList.remove('active');
};
  
function showIcons_() {
    if (!this.icons_.classList.contains('active')) {
      this.activate_(this.icons_);
      this.setIconTimeout_();
    }
};
  
function hideIcons_() {
    if (this.icons_.classList.contains('active')) {
      this.deactivate_(this.icons_);
    }
};
  
function setIconTimeout_() {
    if (this.hideIconsAfterTimeout) {
      window.clearTimeout.bind(this, this.hideIconsAfterTimeout);
    }
    this.hideIconsAfterTimeout = window.setTimeout(function() {
      this.hideIcons_();
    }.bind(this), 5000);
};
window.onmousemove = this.showIcons_.bind(this);


function isChromeApp() {
    return (typeof chrome !== 'undefined' &&
            typeof chrome.storage !== 'undefined' &&
            typeof chrome.storage.local !== 'undefined');
};
// Smart Recording
function toggleSmartRecording_() {
    if (isSmartRecordingEnabled){
        stop_smart_recording()
    }else{
        start_smart_recording();    
    }
};

function start_smart_recording() {
    isSmartRecordingEnabled = true;
    start_detection();
    document.getElementById("smart-recording").classList.add("on");
}

function stop_smart_recording() {
    isSmartRecordingEnabled = false;
    if (isRecordingRunning) {
        stop_recording();
    }
    if (isObjectDetectionRunning && !isObjectDetectionShowing) {
        stop_detection();
    }
    document.getElementById("smart-recording").classList.remove("on");
}

// OBJECT DETECTION
function flipImage(img, ctx, width, height, flipH, flipV) {
    var scaleH = flipH ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
        scaleV = flipV ? -1 : 1, // Set verical scale to -1 if flip vertical
        posX = flipH ? width * -1 : 0, // Set x position to -100% if flip horizontal 
        posY = flipV ? height * -1 : 0; // Set y position to -100% if flip vertical
    
    ctx.save(); // Save the current state
    ctx.scale(scaleH, scaleV); // Set scale to flip the image
    ctx.drawImage(img, posX, posY, width, height); // draw the image
    ctx.restore(); // Restore the last saved state
};

async function load_model() {
    open_loader("PERSON	DETECTION IS LOADING . . .");
    object_detection_model = await cocoSsd.load();
    close_loader()
}

async function start_detection() {
    if (object_detection_model==null) {
        await load_model()
    }
    let last_detection_t;
    var window_height = window.innerHeight;
    var window_width = window.innerWidth;
    var cam_height = video.videoHeight;
    var cam_width = video.videoWidth;
    if (window_height > window_width) {
        var width = window_width;
        var height = window_width * cam_height/cam_width;    
    }else{
        var width = window_height * cam_width/cam_height;
        var height = window_height;
    }
    video.width = canvas.width = width;
    video.height = canvas.height = height;
    isObjectDetectionRunning = true;
    // Box Style
    var gradient = ctx.createLinearGradient(0, 0, 250, 0);
    gradient.addColorStop("0", "red");
    gradient.addColorStop("0.5" ,"magenta");
    gradient.addColorStop("1.0", "blue");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    // Text Style
    ctx.font = "24px Arial";
    while(isObjectDetectionRunning){
        var img = document.getElementById('local-video');
        var predictions = await object_detection_model.detect(img);
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        //flipImage(video, ctx, width, height, true, false);
        ctx.drawImage(video, 0, 0, width, height);

        predictions.forEach(value => {
            if (value['class'] == 'person') {
                if (isSmartRecordingEnabled && !isRecordingRunning) {
                    start_recording();
                }
                xmin = value['bbox'][0];
                ymin = value['bbox'][1];
                xmax = value['bbox'][2];
                ymax = value['bbox'][3];
                ctx.rect(xmin, ymin, xmax, ymax);
                var class_score = value['class']+' '+value['score'].toFixed(2)
                //ctx.fillText(class_score, xmin+5, ymin+23);
                ctx.strokeText(class_score, xmin+5, ymin+25);
                ctx.stroke()
                last_detection_t = new Date()  
            }
        });  
        detection_interval = (new Date() - last_detection_t)/1000; 
        // If there is nothing detected during 5 seconds, save recording.
        if (isSmartRecordingEnabled && isRecordingRunning && detection_interval > 3) {
            stop_recording();
        }
        await sleep(100);
    };
};

function stop_detection() {
    isObjectDetectionRunning = false;
}

async function show_dectection() {
    isObjectDetectionShowing = true;
    if (!isObjectDetectionRunning) {
        if (object_detection_model==null) {
            await load_model()
        }    
        start_detection();
    }
    console.log("start_detection_and_show")
    video.setAttribute('hidden', "");
    canvas.removeAttribute('hidden');
    document.getElementById("object-detection").classList.add('on');
}

function hide_detection() {
    isObjectDetectionShowing = false;
    video.removeAttribute('hidden');
    canvas.setAttribute('hidden', "");
    document.getElementById("object-detection").classList.remove('on');
}

function toggleObjectDetection_() {
    if (isObjectDetectionShowing) {
        hide_detection()
        if(!isSmartRecordingEnabled) {
            stop_detection();
        }
    } else {
        show_dectection();
    }
};

/// FULL SCREEN
function setup_fullscreen() {
    if (isChromeApp()) {
      document.cancelFullScreen = function() {
        chrome.app.window.current().restore();
      };
    } else {
      document.cancelFullScreen = document.webkitCancelFullScreen ||
          document.mozCancelFullScreen || document.cancelFullScreen;
    }
  
    if (isChromeApp()) {
      document.body.w = function() {
        chrome.app.window.current().fullscreen();
      };
    } else {
      document.body.requestFullScreen = document.body.webkitRequestFullScreen ||
          document.body.mozRequestFullScreen || document.body.requestFullScreen;
    }
  
    document.onfullscreenchange = document.onfullscreenchange ||
          document.onwebkitfullscreenchange || document.onmozfullscreenchange;
};


function isFullScreen() {
    if (isChromeApp()) {
      return chrome.app.window.current().isFullscreen();
    }
  
    return !!(document.webkitIsFullScreen || document.mozFullScreen ||
      document.isFullScreen); // if any defined and true
};

function enter_fullscreen() {
    trace('Entering fullscreen.');
    document.querySelector('svg#fullscreen title').textContent =
        'Exit fullscreen';
    document.body.requestFullScreen();
    document.getElementById("fullscreen").classList.add('on');
};

function exit_fullscreen() {
    trace('Exiting fullscreen.');
    document.querySelector('svg#fullscreen title').textContent =
        'Enter fullscreen';
    document.cancelFullScreen();
    document.getElementById("fullscreen").classList.remove('on');
}
function toggleFullScreen_() {
    if (isFullScreen()) {
        exit_fullscreen();
    } else {
        enter_fullscreen();
    }
};

// Webcam  
function start_webcam() {
    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            //video.src = window.URL.createObjectURL(stream);
            video.srcObject = stream;
            video.play();
        });
    };
    document.getElementById("webcam").classList.add('on');
};

function stop_webcam() {
    if (video.srcObject == null) {
        trace("Camera is not enabled");
        return false
    }
    tracks = video.srcObject.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    video.srcObject = null;
    document.getElementById("webcam").classList.remove('on');
}

function toggleWebcam_()  {
    if (video.srcObject == null) {
        start_webcam();
    }else{
        stop_webcam();
    }
};
////

function IconSet_toggle(iconElement) {
    if (iconElement.classList.contains('on')) {
        iconElement.classList.remove('on');
      // turn it off: CSS hides `svg path.on` and displays `svg path.off`
    } else {
      // turn it on: CSS displays `svg.on path.on` and hides `svg.on path.off`
      iconElement.classList.add('on');
    }
};


/// Recording ///
//const mediaSource = new MediaSource();
//mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let record_start_t;

//function handleSourceOpen(event) {
//    console.log('MediaSource opened');
//    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
//    console.log('Source buffer: ', sourceBuffer);
//  }

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
}

function handleStop(event) {
    console.log('Recorder stopped: ', event);
    save_recording();
}

function start_recording() {
    if (isRecordingRunning){
        return 
    }

    let options = {mimeType: 'video/webm'};
    let stream;
    if (isObjectDetectionShowing) {
        stream = canvas.captureStream();
    }else{
        stream = video.captureStream();
    }
    recordedBlobs = [];
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e0) {
      console.log('Unable to create MediaRecorder with options Object: ', e0);
      try {
        options = {mimeType: 'video/webm,codecs=vp9'};
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e1) {
        console.log('Unable to create MediaRecorder with options Object: ', e1);
        try {
          options = 'video/vp8'; // Chrome 47
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (e2) {
          alert('MediaRecorder is not supported by this browser.\n\n' +
            'Try Firefox 29 or later, or Chrome 47 or later, ' +
            'with Enable experimental Web Platform features enabled from chrome://flags.');
          console.error('Exception while creating MediaRecorder:', e2);
          return;
        }
      }
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(100); // collect 100ms of data
    isRecordingRunning = true;
    record_start_t = new Date()
    console.log('MediaRecorder started', mediaRecorder);
    document.getElementById("recording").classList.add("on");
    auto_saving()
    return true;
}
  
function stop_recording() {
    isRecordingRunning = false;    
    mediaRecorder.stop();
    document.getElementById("recording").classList.remove("on");
    record_end_t = new Date();
}

var myBlob = (function () {
    var key, o;
    function myBlob(blob) {
        var url;
        this.blob = blob;
        blob = null;
        this.getURL = function () {
            if (url) return url;
            return url = URL.createObjectURL(this.blob);
        };
        this.dispose = function () {
            if (url) url = URL.revokeObjectURL(url), undefined;
            this.blob = null;
        };
    }
    o = new Blob();
    for (key in o)
        (function (key) {
            Object.defineProperty(myBlob.prototype, key, {
                enumerable: true,
                configurable: true,
                get: function () {return this.blob[key];}
            });
        }(key));
    o = key = undefined;
    return myBlob;
}());

function mem_leak_test() {
    const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    console.log(superBuffer)
    const src_url = window.URL.createObjectURL(superBuffer);
    const mini_video_box = document.createElement('div');
    mini_video_box.classList.add('mini-video-box');
    const start_time = format_date(record_start_t);
    const end_time = format_date(record_end_t);
    var mini_video_box_id = 'video_'+format_date_flat(record_start_t)+'_'+format_date_flat(record_end_t);
    mini_video_box.id = mini_video_box_id;
       
    //title
    const video_title = document.createElement('p');
    video_title.classList.add('title');
    video_title.innerHTML = "Time: "+start_time+" ~ "+end_time;
    mini_video_box.appendChild(video_title);

    // video
    var mini_video_new = document.createElement('video');
    mini_video_new.id = mini_video_box_id+'_video';
    mini_video_new.classList.add('mini-video');
    mini_video_new.src = src_url;
    mini_video_new.type = 'video/webm; codecs="vp8"';
    
    //var source = document.createElement('source');
    //source.src = src_url;
    //source.type = 'video/webm; codecs="vp8"';
    mini_video_new.controls = true;
    mini_video_new.preload = "none";
    //mini_video_new.appendChild(source);
    mini_video_box.appendChild(mini_video_new);
    
    // download button
    const download_button = document.createElement('a');
    download_button.classList.add('download-button');
    download_button.innerHTML = "Download";  
    download_button.href = src_url;
    download_name = start_time+'-'+end_time+'.webm'
    download_button.download = download_name;
    mini_video_box.appendChild(download_button);
    // remove button
    const remove_button = document.createElement('a');
    remove_button.classList.add('remove-button');
    remove_button.innerHTML = "Remove";
    remove_button.onclick = function () { remove_recording(mini_video_box_id);};    
    remove_button.href="#";
    mini_video_box.appendChild(remove_button);
    
    var mini_video_boxes = document.getElementById("mini-video-boxes");
    mini_video_boxes.prepend(mini_video_box);

    mini_video_counter_update();
    if (isAutoDownloadRunning) {        
        setTimeout(() => {
            download_button.click();
            remove_button.click();
        }, 100);
    }    
    //console.log("---delete---");
    //sleep(1000);
    //mini_video_new.removeAttribute('src'); // empty source;
    //console.log("---______---");
}

function save_recording() {
    const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    console.log(superBuffer)
    const src_url = window.URL.createObjectURL(superBuffer);
    const mini_video_box = document.createElement('div');
    mini_video_box.classList.add('mini-video-box');
    const start_time = format_date(record_start_t);
    const end_time = format_date(record_end_t);
    var mini_video_box_id = 'video_'+format_date_flat(record_start_t)+'_'+format_date_flat(record_end_t);
    mini_video_box.id = mini_video_box_id;
       
    //title
    const video_title = document.createElement('p');
    video_title.classList.add('title');
    video_title.innerHTML = "Time: "+start_time+" ~ "+end_time;
    mini_video_box.appendChild(video_title);

    // video
    var mini_video_new = document.createElement('video');
    mini_video_new.id = mini_video_box_id+'_video';
    mini_video_new.classList.add('mini-video');
    mini_video_new.src = src_url;
    mini_video_new.type = 'video/webm; codecs="vp8"';
    
    //var source = document.createElement('source');
    //source.src = src_url;
    //source.type = 'video/webm; codecs="vp8"';
    mini_video_new.controls = true;
    mini_video_new.preload = "none";
    //mini_video_new.appendChild(source);
    mini_video_box.appendChild(mini_video_new);
    
    // download button
    const download_button = document.createElement('a');
    download_button.classList.add('download-button');
    download_button.innerHTML = "Download";  
    download_button.href = src_url;
    download_name = start_time+'-'+end_time+'.webm'
    download_button.download = download_name;
    mini_video_box.appendChild(download_button);
    // remove button
    const remove_button = document.createElement('a');
    remove_button.classList.add('remove-button');
    remove_button.innerHTML = "Remove";
    remove_button.onclick = function () { remove_recording(mini_video_box_id);};    
    remove_button.href="#";
    mini_video_box.appendChild(remove_button);
    
    var mini_video_boxes = document.getElementById("mini-video-boxes");
    mini_video_boxes.prepend(mini_video_box);

    mini_video_counter_update();
    if (isAutoDownloadRunning) {        
        setTimeout(() => {
            download_button.click();
            remove_button.click();
        }, 100);
    }    
}

function remove_recording(mini_video_box_id) {
    console.log(mini_video_box_id);
    var mini_video_box = document.getElementById(mini_video_box_id);
    var mini_video = document.getElementById(mini_video_box_id+'_video');
    window.URL.revokeObjectURL(mini_video.src);    
    mini_video.removeAttribute('src'); // empty source
    mini_video.parentNode.removeChild(mini_video);
    mini_video_box.parentNode.removeChild(mini_video_box);
    mini_video_counter_update();
} 
//121,872K

function download_all() {
    boxes = document.getElementById("mini-video-boxes");
    box_list = boxes.children;
    for (var i=0; i<box_list.length; i++) {
        box = box_list[i];
        download_button = box.getElementsByClassName("download-button")[0];
        download_button.click();
    }
}

function remove_all() {
    boxes = document.getElementById("mini-video-boxes");
    box_list = boxes.children;
    for (var i=box_list.length-1; i>=0; i--) {
        box = box_list[i];
        remove_button = box.getElementsByClassName("remove-button")[0];
        remove_button.click();
    }
}

function auto_download_and_remove_toggle_() {
    auto_download_button = document.getElementById("auto-download-button");
    if(isAutoDownloadRunning) {
        isAutoDownloadRunning = false;  
        auto_download_button.classList.remove("activate");
    }else{
        isAutoDownloadRunning = true;
        auto_download_button.classList.add("activate");

    }
}

async function restart_recording() {
    stop_recording()
    await sleep(100);
    start_recording()
}

async function auto_saving() {
    while(isRecordingRunning) {
        duration = (new Date() - record_start_t) /1000;
        if (duration > 60) {
            restart_recording()
        }
        await sleep(1000);
    }
}

function toggleRecording_() {
    if (!isRecordingRunning) {
        start_recording();
    } else {
        stop_recording();
    }
    if (isSmartRecordingEnabled) {
        stop_smart_recording();
    }
}

this.objectdetectionIconSet_ = document.getElementById("object-detection");
this.objectdetectionIconSet_.onclick = toggleObjectDetection_.bind(this);
this.fullscreenIconSet_ = document.getElementById("fullscreen");
this.fullscreenIconSet_.onclick = toggleFullScreen_.bind(this);
this.webcamIconSet_ = document.getElementById("webcam");
this.webcamIconSet_.onclick = toggleWebcam_.bind(this);
this.recordingIconSet_ = document.getElementById("recording");
this.recordingIconSet_.onclick = toggleRecording_.bind(this);
this.smartrecordingIconSet_ = document.getElementById("smart-recording");
this.smartrecordingIconSet_.onclick = toggleSmartRecording_.bind(this);
this.downlaod_all_button = document.getElementById("download-all-button");
this.downlaod_all_button.onclick = download_all.bind(this);
this.remove_all_button = document.getElementById("remove-all-button");
this.remove_all_button.onclick = remove_all.bind(this);
this.auto_download_and_remove_button = document.getElementById("auto-download-button");
this.auto_download_and_remove_button.onclick = auto_download_and_remove_toggle_.bind(this);