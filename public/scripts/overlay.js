/* 
streetview overlay script originally 
written by team maps

You are free to use and modify this code provided that you:
(1) Include this notice within the javascript code
(2) Display a link to http://teammaps.com on the page that contains the Street View Tour.

*/ 




var svo = null;

// the main application object
function SVO(LAT, LNG)
{
    // Trafalgar Square
    //     this.lat = 51.507768;

    // this is where the image is 
    this.lat = LAT;
    this.lng = LNG;
    this.zoom = 16;


    //    this.slat = 51.507527;
    // this is where you are 
    this.slat = 51.507527;
    this.slng = -0.128652;

    // dynamically assign images 
    for(var i = 0; i < pData.size; i++){
        this["image" + i] = pData[i].img_url; 
    }


    this.pt = new google.maps.LatLng(this.lat, this.lng);
    this.streetPt = new google.maps.LatLng(this.slat, this.slng);

    // initial POV
    this.sheading = 69.58;
    this.spitch = 0;
    this.szoom = 1;

    this.distance = 0;  // distance in metres from street view to marker
    this.maximumDistance = 200;     // distance beyond which marker is hidden

    // dimensions of street view container (fixed)
    this.panWidth = 480;
    this.panHeight = 480;

    // dimensions of marker container (resized according to current pov)
    this.markerWidth = 120;
    this.markerHeight = 80;
}


// create map
SVO.prototype.m_initMap = function ()
{
    var mapDiv = eid("mapDiv");

    var mapOptions =
    {
        center: this.pt,
        zoom: this.zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scaleControl: true,
        mapTypeControl: false
    };

    map = new google.maps.Map(mapDiv, mapOptions);
}


// create street view
SVO.prototype.m_initPanorama = function (i)
{
    var visible = false;
    var l_panDiv = eid("panDiv");

    // controls can be hidden here to prevent the position being changed by the user
    var l_panOptions =
    {
        // zoomControl: false,
        // linksControl: false
    };

    l_panOptions.position = this.streetPt;
    l_panOptions.pov =
    {
        heading: this.sheading,
        pitch: this.spitch,
        zoom: this.szoom
    };

    // create new panorama only if first pass 
    if(i == 0){
        pan = new google.maps.StreetViewPanorama(l_panDiv, l_panOptions);
        map.setStreetView(pan);
    }

    // event handlers    
    google.maps.event.addListener(pan, 'pov_changed', function ()
    {
        console.log('updating pov ' + i); 
        svo.m_updateMarker(i);
    });

    google.maps.event.addListener(pan, 'zoom_changed', function ()
    {
        console.log('updating zoom ' + i); 
        svo.m_updateMarker(i);
    });

    google.maps.event.addListener(pan, 'position_changed', function ()
    {
        console.log('updating position ' + i ); 

        // your position 
        svo.streetPt = pan.getPosition();
        map.setCenter(svo.streetPt);

        svo.m_updateMarker(i);
    });

}




function Marker(p_name, p_icon, p)
{
    this.m_icon = "";

    this.pt = null;
    this.m_pov = null;

    this.m_pixelpt = null;
}

// convert the current heading and pitch (degrees) into pixel coordinates
SVO.prototype.m_convertPointProjection = function (p_pov, p_zoom)
{
    var l_fovAngleHorizontal = 90 / p_zoom;
    var l_fovAngleVertical = 90 / p_zoom;

    var l_midX = this.panWidth / 2;
    var l_midY = this.panHeight / 2;

    var l_diffHeading = this.sheading - p_pov.heading;
    l_diffHeading = normalizeAngle(l_diffHeading);
    l_diffHeading /= l_fovAngleHorizontal;

    var l_diffPitch = (p_pov.pitch - this.spitch) / l_fovAngleVertical;

    var x = l_midX + l_diffHeading * this.panWidth;
    var y = l_midY + l_diffPitch * this.panHeight;

    var l_point = new google.maps.Point(x, y);

    return l_point;
}

// create the 'marker' (a div containing an image which can be clicked)
SVO.prototype.m_initMarker = function (i)
{
    var whichDiv = ""; 
    var whichIMG = "";
    if(i == 0){
        whichDiv = "markerDiv0";
        whichIMG = this["image" + 0];  
    }
    if(i == 1){
        whichDiv = "markerDiv1";
        whichIMG = this["image" + 1];  
    }

    var l_markerDiv = eid(whichDiv);
    l_markerDiv.style.width = this.markerWidth + "px";
    l_markerDiv.style.height = this.markerHeight + "px";

    var l_iconDiv = eid(whichDiv);
    l_iconDiv.innerHTML = "<img src='" + whichIMG + "' width='100%' height='100%' alt='' />";

    this.m_updateMarker(i);
}


SVO.prototype.m_updateMarker = function (i)
{
    var whichDiv = "";
    if(i == 0){
        whichDiv = "markerDiv0";
    }
    if(i == 1){
        whichDiv = "markerDiv1"; 
    }


    var l_pov = pan.getPov();
    if (l_pov)
    {
        var l_zoom = pan.getZoom();

        // scale according to street view zoom level
        var l_adjustedZoom = Math.pow(2, l_zoom) / 2;


        // recalulate icon heading and pitch now0
        this.sheading = google.maps.geometry.spherical.computeHeading(this.streetPt, this.pt)
        this.distance = google.maps.geometry.spherical.computeDistanceBetween(this.streetPt, this.pt);

        var l_pixelPoint = this.m_convertPointProjection(l_pov, l_adjustedZoom);

        var l_markerDiv = eid(whichDiv);


        var l_distanceScale = 50 / this.distance;
        l_adjustedZoom = l_adjustedZoom * l_distanceScale;

        // _TODO scale marker according to distance from view point to marker 
        // beyond maximum range a marker will not be visible

        // apply position and size to the marker div
        var wd = this.markerWidth * l_adjustedZoom;
        var ht = this.markerHeight * l_adjustedZoom;

        var x = l_pixelPoint.x - Math.floor(wd / 2);
        var y = l_pixelPoint.y - Math.floor(ht / 2);

        l_markerDiv.style.display = "block";
        l_markerDiv.style.left = x + "px";
        l_markerDiv.style.top = y + "px";
        l_markerDiv.style.width = wd + "px";
        l_markerDiv.style.height = ht + "px";


        // hide marker when its beyond the maximum distance
        l_markerDiv.style.display = this.distance < this.maximumDistance ? "block" : "none";
        // glog("distance = " + Math.floor(this.distance) + " m (" + l_markerDiv.style.display + ") distance scale = " + l_distanceScale + " l_adjustedZoom = " + l_adjustedZoom);

    }
}

// display a message when the user clicks on the marker's div
function markerClick()
{
    eid("markerClick").innerHTML = "<h2>!!!</h2>";
}



function loadPage()
{

    svo = new SVO(51.507768, -0.127957);
    svo.m_initMap();
    svo.m_initPanorama(0);
    svo.m_initPanorama(1); 
    svo.m_initMarker(0);
    svo.m_initMarker(1);  
}


// utils
function eid(id)
{
    return document.getElementById(id);
}

function glog(a)
{
    if (typeof (console) != "undefined" && console && console.log)
    {
        console.log(a);
    }
}


function formatFloat(n, d)
{
    var m = Math.pow(10, d);
    return Math.round(n * m, 10) / m;
}


function normalizeAngle(a)
{

    while (a > 180)
    {
        a -= 360;
    }

    while (a < -180)
    {
        a += 360;
    }

    return a;
}
