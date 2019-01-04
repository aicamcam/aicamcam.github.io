# aicamcam.github.io
Smart webcam service. Object(person/dog/cat) detection and record video. Running without any server connection. Powered by HTML5, Tensorflow.js

[aicamcam_capture]()  


### Tested Environment
Chrome - 71.0.3578.98
 
### How to use
#### 1. Configuration
[setting from chrome]()  
Please enable chrome to use webcam.  
If you want to auto download recorded video, Please enable media Download.   
All setting is done.  

#### 2. Object detection  
Let's check object detection is working or not, Clikck "Test Object Detection" button.  
[object detection button]()  
1~2 minute needed to load TFJS model.  
  
#### 3. Smart Recording  
Let's check "Smart Recording" Button.  
[smart recording button]()  
During smart recording mode,   
If a object is detected then recording is started. The recording is stoped when the object disapear for 3 seconds.   
If the recording is continue for 1 minute, recording video is created and re-start recording to record next 1 minute.  

#### 4. Recording 
[recorded videos]()  

#### 5. Navigator
[Hamberger button]()  
Click hamberger button and check out the created video.   
User can download or remove video. the videos hold system memory until user remove it.   
To save system memory, please download and remove video from navigator.   

#### 6. Auto download
[auto_download]()  
If you plan to use long-term recording, 
Click auto download and remove button.  




#### Side Icons  
##### Smart Recording:   
 - Start Recording when a object(person, dog, cat) is detected  
 - Stop Recording when waiting 3 secs after the object is disapear  
#### Test Object Detection:  
 - Show bounding box of detected objects on the video  
##### Camera:  
 - Enable Webcam   
##### Fullscreen:  
 - Enter or Exit Full Screen  
##### Recording:  
 - Start or Stop video recording  
 - no detection used  
 - just record  

#### Navigator(Hamberger Button)  
 - Recorded Video is showed up  
##### Download all  
 - Download all videos in Navigator  
##### Remove all  
 - Remove all videos in Navigator  
##### Auto Donwload & Remove  
 - When recorded video is added to navigator, autometicaly download and remove the video  
 - This option save your system memory  
 
 
 



