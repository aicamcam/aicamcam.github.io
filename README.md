# [aicamcam.github.io](https://aicamcam.github.io)  
 - Smart webcam service
 - Object(person/dog/cat) detection and record video
 - Off-line running after loading object detection model
 - Powered by HTML5, Tensorflow.js  
 
[한국어 설명](pages/README_han.md)

<img src="pages/images/aicamcam_capture.png" width="800" height="450" />


### Tested Environment
Chrome - 71.0.3578.98
 
### How to use
#### 1. Configuration
<img src="pages/images/setting.png" width="366" height="308" />

Please allow chrome to use "Webcam".  
If you want to auto download for recorded video, Please allow "Automatic Downloads".   

#### 2. Object detection  
<img src="pages/images/side_button_od.png" width="160" height="60" />

To test object detection, click "Test Object Detection" button. 
Loading TFJS model take 1~2 minutes.  
This button draw bounding box to video. 

#### 3. Smart Recording  
<img src="pages/images/side_button_smart_recording.png" height="60" />

To start smart recording, click "Smart Recording" Button.  
During smart recording mode,   
If a object is detected, Recording is started.  
If the object disapear for 3 seconds, Recording is stoped.   
If recording is continued for 1 minute, record video is created and recording is re-started.  

#### 4. Recording 
<img src="pages/images/side_button_recording.png" height="60" />

To start recording, click "Recording" Button.  
This button start recording regardless of object detection. 
If recording is continued for 1 minute, record video is created and recording is re-started.  

#### 5. Navigator
<img src="pages/images/hamburger_button.png" height="60" />

##### 5.1. video
Click "hamberger" button and check out the created video.   
User can download or remove video. 
The video hold system memory until user remove it.   
To save system memory, please download and remove video from navigator.   

##### 5.2. Auto download
<img src="pages/images/auto_download.png" height="100" />
If you plan to use long-term recording, Click auto "Auto Download & Remove" button.  

##### 5.3. download all and remove all 
Download all and remove all videos
