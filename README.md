# nino
Nino is a VOD streaming service built around the Google Drive API with nodeJs

### What is nino and how does it work ?
Nino is a web application that allows you to store, organise, download and stream media contents available on your Google Drive.
The application enables you share this library without compromising the integrity of the original files.
It organises the Movies and TV shows on your drive account, providing you with their trailer, HD images and other info

#### Setup
* For setup clone the repo, install the dependencies and run "npm run start"
* visit http://localhost:5000
* Follow the setup process in the browser
* Replace the nino.json file in the config folder
* Close the server and run "npm run start" 
* To scan your library or perform any admin task, visit http://localhost:5000/update (from here you can access other admin pages)
* To create auth keys log in as admin and visit http://localhost:5000/auth/generateKey

#### How to arrange the files
* For movies, it is imperative that only the movie file itself is placed directly in the movie folder like so ![](art/22.png)
* For TV shows every Show should be placed in its folder like so ![](art/24.png)
* When arranging the episodes you have two options
    * Place each episode in its corresponding Season folder, like so (Recommended) ![](art/25.png) ![](art/26.png)
    * Alternatively you can place them directly in the Show folder but only if they can pass this s|SXX .. eE|XX naming scheme, for example;
        * S01 - E01
        * S01 randomText E01  
        * s01e01 | S01E01
    like so ![](art/23.png)


## Some Features of nino
* The boarding page ![](art/1.png)
* The boarding page ![](art/2.png)
* The boarding page ![](art/3.png)
* The homepage after authentication with some segments shown ![](art/4.png)
* Some more segments shown ![](art/6.png)
* Some more segments shown with youtube trailers ![](art/16.png)
* The active search feature ![](art/5.png)
* This is how media metadata is displayed on nino  ![](art/7.png)
* Viewing more details on selected media ![](art/8.png)
* Clicking on an actor or someone from the production team shows ![](art/9.png)
* Clicking on their videography ![](art/10.png)
* Clicking on a production company show ![](art/17.png)

#### Some images from the video player
* Preview frame ![](art/21.png)
* Up next button ![](art/11.png)
* Video paused ![](art/12.png)
* Downloading videos require an auth key from the admin ![](art/13.png)
* Videos can be shared from current position or from the beginning (no authentication required for sharing or viewing) ![](art/14.png)
* Not available on this version of nino is subtitles ![](art/15.png)
* You can skip recaps for TV Episodes ![](art/18.png)
* When a video buffers ![](art/19.png)
* Nino plays the next video once current video has been completely seen ![](art/20.png)
