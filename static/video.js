// Grab elements, create settings, etc.
let object_detection_model = null;
let isObjectDetectionRunning = false;
let isObjectDetectionShowing = false;
let isRecordingRunning = false;
let isSmartRecordingEnabled = false;
let isAutoDownloadRunning = false;
let isNavOpend = false;

init()

// Utils
function init() {
    start_webcam()
    setup_fullscreen();
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
};

function format_date(date) {
    let d = new Date(date);
    let year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let hour = '' + d.getHours();
    let minute = '' + d.getMinutes();
    let second = '' + d.getSeconds();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return year+'/'+month+'/'+day+'_'+hour+':'+minute+':'+second;
};

function format_date_string(date) {
    let year = date.substring(0, 4);
    let month = date.substring(4, 6);
    let day = date.substring(6, 8);
    let hour = date.substring(8, 10);
    let minute = date.substring(10, 12);
    let second = date.substring(12, 14);
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return year+'/'+month+'/'+day+'_'+hour+':'+minute+':'+second;
};

function format_date_flat(date) {
    let d = new Date(date);
    let year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let hour = '' + d.getHours();
    let minute = '' + d.getMinutes();
    let second = '' + d.getSeconds();
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
    let loader_modal = document.getElementById("loader_modal");
    document.getElementById("loader_message").innerHTML = text;
    loader_modal.style.display = "block";
}

function close_loader() {
    let loader_modal = document.getElementById("loader_modal");
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
    document.getElementById("mini-video-counter").innerText = document.getElementById("mini-video-boxes").children.length;
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
    if (!isSmartRecordingEnabled) {
        isSmartRecordingEnabled = true;
        start_detection();
        document.getElementById("smart-recording").classList.add("on");
    }else{
        console.log("start_smart_recording is already running");
    }
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
    let scaleH = flipH ? -1 : 1; // Set horizontal scale to -1 if flip horizontal
    let scaleV = flipV ? -1 : 1; // Set verical scale to -1 if flip vertical
    let posX = flipH ? width * -1 : 0; // Set x position to -100% if flip horizontal 
    let posY = flipV ? height * -1 : 0; // Set y position to -100% if flip vertical
    
    ctx.save(); // Save the current state
    ctx.scale(scaleH, scaleV); // Set scale to flip the image
    ctx.drawImage(img, posX, posY, width, height); // draw the image
    ctx.restore(); // Restore the last saved state
};

async function load_model() {
    open_loader("OBJECT	DETECTION IS LOADING . . .");
    object_detection_model = await cocoSsd.load();
    close_loader()
}

async function start_detection() {
    if (object_detection_model==null) {
        await load_model()
    }
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let video = document.getElementById('local-video');
    let last_detection_t;
    let window_height = window.innerHeight;
    let window_width = window.innerWidth;
    let cam_height = video.videoHeight;
    let cam_width = video.videoWidth;
    let width;
    let height;
    if (window_height > window_width) {
        width = window_width;
        height = window_width * cam_height/cam_width;    
    }else{
        width = window_height * cam_width/cam_height;
        height = window_height;
    }
    video.width = canvas.width = width;
    video.height = canvas.height = height;
    isObjectDetectionRunning = true;
    // Box Style
    let gradient = ctx.createLinearGradient(0, 0, 250, 0);
    gradient.addColorStop("0", "red");
    gradient.addColorStop("0.5" ,"magenta");
    gradient.addColorStop("1.0", "blue");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    // Text Style
    ctx.font = "24px Arial";
    while(isObjectDetectionRunning) {
        let predictions = await object_detection_model.detect(video);
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        //flipImage(video, ctx, width, height, true, false);
        ctx.drawImage(video, 0, 0, width, height);
        predictions.forEach(value => {
            if (['person', 'cat', 'dog'].indexOf(value['class']) > -1) {
                if (isSmartRecordingEnabled && !isRecordingRunning) {
                    start_recording();
                }
                let xmin = value['bbox'][0];
                let ymin = value['bbox'][1];
                let xmax = value['bbox'][2];
                let ymax = value['bbox'][3];
                ctx.rect(xmin, ymin, xmax, ymax);
                let class_score = value['class']+' '+value['score'].toFixed(2)
                ctx.fillText(class_score, xmin+5, ymin+23);
                ctx.strokeText(class_score, xmin+5, ymin+25);
                ctx.stroke()
                last_detection_t = new Date()  
            }
        });  
        let detection_interval = (new Date() - last_detection_t)/1000; 
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
    //console.log("start_detection_and_show")
    document.getElementById('local-video').setAttribute('hidden', "");
    document.getElementById('canvas').removeAttribute('hidden');
    document.getElementById("object-detection").classList.add('on');
}

function hide_detection() {
    isObjectDetectionShowing = false;
    document.getElementById('local-video').removeAttribute('hidden');
    document.getElementById('canvas').setAttribute('hidden', "");
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
    document.querySelector('svg#fullscreen title').textContent =
        'Exit fullscreen';
    document.body.requestFullScreen();
    document.getElementById("fullscreen").classList.add('on');
};

function exit_fullscreen() {
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
    let video = document.getElementById('local-video');
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
    let video = document.getElementById('local-video');
    if (video.srcObject == null) {
        return false
    }
    let tracks = video.srcObject.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    video.srcObject = null;
    tracks = null;
    video = null;
    document.getElementById("webcam").classList.remove('on');
}

function toggleWebcam_()  {
    if (document.getElementById('local-video').srcObject == null) {
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
let mediaRecorder;
let recordedBlobs;

function start_recording() {
    if (isRecordingRunning){
        return 
    }
    isRecordingRunning = true;
    recordedBlobs = [];
    if (mediaRecorder == undefined) {
        let options = {mimeType: 'video/webm'};
        let stream = document.getElementById('local-video').captureStream();
        //let stream = document.getElementById('canvas').captureStream();
        try {
            mediaRecorder = new MediaRecorder(stream, options);
          } catch (e0) {
            //console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
              options = {mimeType: 'video/webm,codecs=vp9'};
              mediaRecorder = new MediaRecorder(stream, options);
            } catch (e1) {
              //console.log('Unable to create MediaRecorder with options Object: ', e1);
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
        mediaRecorder.onstop = handleStop;
        mediaRecorder.ondataavailable = handleDataAvailable;    
    }
    mediaRecorder.start()
    
    let record_start_t = new Date()
    let mini_video_box = document.createElement('div');
    mini_video_box.id = 'video_'+format_date_flat(record_start_t);
    mini_video_box.classList.add('mini-video-box');

    let video_title = document.createElement('p');
    video_title.classList.add('title')  ;
    video_title.innerHTML = "Time: "+format_date(record_start_t)+" ~ ";
    mini_video_box.appendChild(video_title);
    document.getElementById("mini-video-boxes").prepend(mini_video_box)
    document.getElementById("recording").classList.add("on");
    auto_restart();
}
  
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
}

function stop_recording() {
    mediaRecorder.stop();
    isRecordingRunning = false;    
    document.getElementById("recording").classList.remove("on");
}

function handleStop(event) {
    save_recording();
}

function save_recording() {
    let mini_video_box = document.getElementById("mini-video-boxes").firstChild
    let start_time = format_date_string(mini_video_box.id.substring(6));
    let record_end_t = new Date();
    let end_time = format_date(record_end_t);
    let title = mini_video_box.getElementsByClassName("title")[0]
    title.innerHTML = title.innerHTML + end_time
    
    let superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    let src_url = window.URL.createObjectURL(superBuffer);

    let download_button = document.createElement('a');
    download_button.classList.add('download-button');
    download_button.innerHTML = "Download";  
    download_button.href = src_url;
    download_button.download = start_time+'-'+end_time+'.webm';
    
    let remove_button = document.createElement('a');
    remove_button.classList.add('remove-button');
    remove_button.innerHTML = "Remove";
    remove_button.onclick = remove_recording;
    remove_button.href="#";

    mini_video_counter_update();
    if (isAutoDownloadRunning) {   
        mini_video_box.appendChild(remove_button);     
        setTimeout(() => {
            download_button.click();    
            remove_button.click();
            remove_button.onclick = null;
        }, 100);
    }else{
        let mini_video_new = document.createElement('video');
        mini_video_new.classList.add('mini-video');
        mini_video_new.src = src_url;
        mini_video_new.type = 'video/webm; codecs="vp8"';
        mini_video_new.controls = true;
        mini_video_new.preload = "none";
        mini_video_box.appendChild(mini_video_new);
        mini_video_box.appendChild(download_button);
        mini_video_box.appendChild(remove_button);
    } 
    console.log("save_recording end");
}

function remove_recording() {
    let mini_video_box = this.parentNode
    while (mini_video_box.firstChild) {
        if (mini_video_box.firstChild.className == "mini-video") {
            window.URL.revokeObjectURL(mini_video_box.firstChild.src);  
            mini_video_box.firstChild.src= "";
        }
        if (mini_video_box.firstChild.className == "download-button") {
            mini_video_box.firstChild.href= "";
        }
        old_node = mini_video_box.removeChild(mini_video_box.firstChild);
        delete old_node;
    }
    mini_video_box.remove();
    console.log("remove_recording");
    mini_video_counter_update();
} 

function download_all() {
    let boxes = document.getElementById("mini-video-boxes");
    let box_list = boxes.children;
    for (let i=0; i<box_list.length; i++) {
        box_list[i].getElementsByClassName("download-button")[0].click();        
    }
}

function remove_all() {
    let boxes = document.getElementById("mini-video-boxes");
    let box_list = boxes.children;
    for (let i=box_list.length-1; i>=0; i--) {
        box_list[i].getElementsByClassName("remove-button")[0].click();        
    }
}

function auto_download_and_remove_toggle_() {
    let auto_download_button = document.getElementById("auto-download-button");
    if(isAutoDownloadRunning) {
        isAutoDownloadRunning = false;  
        auto_download_button.classList.remove("activate");
    }else{
        isAutoDownloadRunning = true;
        auto_download_button.classList.add("activate");
    }
}

//async function auto_restart() {
//    let video_duration = document.getElementById("video-duration").value;
//    console.log(video_duration, format_date(new Date()))
//    await sleep(video_duration*1000);
//    restart_recording();
//}

async function auto_restart() {
    let video_duration = document.getElementById("video-duration").value;
    console.log(video_duration, format_date(new Date()))
    record_start_t = new Date() 
    while(isRecordingRunning) {
        duration = (new Date() - record_start_t) /1000;
        if (duration > video_duration) {
            restart_recording()
            break;
        }
        await sleep(1000);
    }
    console.log("auto_restart end:", record_start_t)
}

async function restart_recording() {
    stop_recording();
    await sleep(100);
    start_recording();
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