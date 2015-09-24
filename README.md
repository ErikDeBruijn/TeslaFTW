TeslaFTW
========

Pebble App to control your Tesla Model S/X or hopefully soon the Model III (economy).

Click below for a demo video:

[![Alt text for your video](http://img.youtube.com/vi/GXDTFnsRmms/0.jpg)](http://youtu.be/GXDTFnsRmms)

Some screenshots:

![Screenshots](https://raw.github.com/ErikDeBruijn/TeslaFTW/master/Pebble-Screenshots.png)

It uses the Tesla API to control your Tesla. It will allow you to do things like the following:

 - Turn on/off A/C (or car pre-heating in winter)
 - See indoor and outdoor temperature
 - Start/stop charging
 - See battery status, possible range and charge rate + cost information
 - Lock your car
 - Honk the horn
 - Flash the lights

The functions are ordered so that the menu's at the top are the things I use most. It will automatically start retrieving charge info once opened.

Installation
============

The easiest way is to use the new Pebble Store, from the Pebble App.

Android:

 - Run the Pebble App. It will ask you to sign up for a Pebble account.
 - Allow it to install the latest Pebble firmware on your pebble (v2.0.1 or later).
 - Choose "Get Apps" in the Pebble App to enter the "Pebble Store"
 - Search "Tesla" in the Pebble Store to find the WatchApp. Click add/get/install.
 - If the above doesn't work, use the PBW: Download the PBW file to your paired phone [here](https://github.com/ErikDeBruijn/TeslaFTW/blob/master/build/TeslaFTW.pbw?raw=true).
 - Your watch will now have the Tesla app. It will ask you to configure it on the phone.
 - From the Phone app, go into "My Pebble". Tap the "Settings" button under the Tesla App icon.
 - Then, enter the login of your Tesla account and your preferences.
 - Go into the Tesla WatchApp from the main menu. The first time takes longer, it needs to find your vehicle.
 - Now you can use the app!

iPhone:

Note that iPhone support is untested as I don't have an iPhone.

 - Find the new Pebble App (v2) in the App store.
 - Run the new Pebble App. It will ask you to sign up for a Pebble account.
 - Allow it to install the latest Pebble firmware v2 on your pebble.
 - Choose "Get Apps" in the Pebble App to enter the "Pebble Store"
 - Search "Tesla" in the Pebble Store to find the WatchApp. Click add/get/install.
 - Your watch will now have the Tesla app. It will ask you to configure it on the phone.
 - From the Phone app, go into "My Pebble". Tap the "Settings" button under the Tesla App icon.
 - Then, enter the login of your Tesla account and your preferences.
 - Go into the Tesla WatchApp from the main menu. The first time takes longer, it needs to find your vehicle.
 - Now you can use the app!

Status / Warranty
=================

Using this application is entirely at your own risk. No guarantee is given I use the app all the time, but that doesn't mean it will work for you.

Compatibility
=============

 - Pebble firmware 2.0.1. Pebble Time.
 - Android: PebbleApp 2.0 Beta 10 or later.
 - iPhone might not be working at the moment, I can't test this because I only have an Android Phone.

The app doesn't require a companion app on your Android/iOS device, but needs a recent PebbleApp.

Development
===========

If you want to help out with development, that's great! The app needs some work in several areas.

Wishlist:

 - Stability in general
 - Lots of testing on more pebbles with more phones. Only used my own Android with a 'regular' black Pebble.
 - For one, it should be easier to set up for a new user. E.g. it should tell you to go to settings in the App when unconfigured.
 - Allow you to set up miles instead of kilometers, and other currencies (for charging cost calculation)
