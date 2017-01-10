function searchParam(stringURL, param){
  urlParams = stringURL.split('&');
  paramValue = [];
  for (i=urlParams.length -1; i >=0; i-- ){
    value = urlParams[i];
    pos = value.indexOf(param);
		if (pos >= 0){
			paramValue = decodeURIComponent(value.substr(pos+param.length+1,value.length)).split(',');
			break;
		}
	}
  return paramValue.length>1? paramValue : paramValue.toString();
}


var app = angular.module('sepim', ['ionic', 'ui.router']);
app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    navigator.splashscreen.hide();
  });
});

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  //$ionicConfigProvider.views.transition('android');

  $stateProvider
    .state('categories', {
      url: '/categories/:idCat',
      templateUrl: 'categories.html',
      controller: 'CategoriesCtrl'
    })
    .state('data', {
      url: '/data/:idCat',
      templateUrl: 'data.html',
      controller: 'DataCtrl'
    }).state('search', {
      url: '/search',
      templateUrl: 'search.html',
      controller: 'SearchCtrl'
    }).state('mapkml', {
      cache: false,
      url: '/map',
      params : {idCat:null,element:null},
      templateUrl: 'map.html',
      controller: 'MapKMLCtrl'
    }).state('mapgb', {
      cache: false,
      url: '/map',
      params : {gbResult:null},
      templateUrl: 'map.html',
      controller: 'MapGBCtrl'
    }).state('home', {
      url: '/',
      templateUrl: 'home.html',
      controller: 'AppCtrl'
    });

  $urlRouterProvider.otherwise("/");

});

app.controller('AppCtrl', function($scope, $rootScope, $http) {
    $http.get(url + "/application/" + idAplicacion)
      .success(function(data, status, headers,config){
        $rootScope.app = data;
        //apaño para tener acceso desde el html - estudiar
        $rootScope.url = url;
        //console.log(data.wmcURL,'wmcfile');
      })
      .error(function(data, status, headers,config){
        console.log('data error');
      });
});

app.controller('CategoriesCtrl', function($scope, $stateParams, $http) {

    if($stateParams.idCat != ""){
  		requestParam = "?id_categoria=" + $stateParams.idCat;
  		//pilaCategorias.push(cat);
  	}else{
  		requestParam = "?id_aplicacion=" + $scope.app.id;
  	}
    $http.get(url + "/categorias" + requestParam)
      .success(function(data, status, headers,config){
        $scope.categories = data;
      })
      .error(function(data, status, headers,config){
        console.log('data error');
      });
});

app.controller('DataCtrl', function($scope, $state, $stateParams, $http) {

    var requestParam = "";

    if($scope.app.idEntidad!=null){
      $scope.showDistance = false; //JGL - en búsquedas por categoría no mostramos la distancia
      requestParam += "?id_entidad=" + $scope.app.idEntidad;
    }else{
      $scope.showDistance = true;
      requestParam += "?x=" + coor_x + "&y=" + coor_y;
    }
    $http.get(url + "/datos/"+ $stateParams.idCat + requestParam)
      .success(function(data, status, headers,config){
        $scope.items = data;
      })
      .error(function(data, status, headers,config){
        console.log('data error');
      });

    $scope.showMap = function(item){
      $state.go('mapkml', {idCat: $stateParams.idCat, element : item});
    }
});

app.controller('SearchCtrl', function($scope, $state, $stateParams, $http) {

  $scope.suggest = function(){
    //No funciona: jsonpCallbackParam: "json.wrf"
    $http.jsonp(urlGB + "/suggest", {params: {
                                                 "json.wrf": 'JSON_CALLBACK',
                                                 "spellcheck.q": $scope.txtSearch,
                            			               "wt": 'json'
                            			          }})
      .success(function(data, status, headers,config){
        if (data.spellcheck.suggestions.length>0){
          $scope.suggestions = data.spellcheck.suggestions[1].suggestion;
        }else{
          delete $scope.suggestions;
        }
      })
      .error(function(data, status, headers,config){
        console.log('data error');
      });
  }

  $scope.search = function(){
    $http.jsonp(urlGB + "/search", {params: {
                                            "json.wrf": 'JSON_CALLBACK',
                            			          "q": $scope.txtSearch,
                            			          "wt": 'json',
                                            "rows": gbRows
                            			       }})
      .success(function(data, status, headers,config){
        //TODO:comprobar si hay docs y abrir el 0
        $state.go("mapgb",{gbResult: data.response.docs[0]});

      })
      .error(function(data, status, headers,config){
        console.log('data error');
      });
  }
});

app.controller('MapKMLCtrl', function($scope, $stateParams) {
    mapProjection = 'EPSG:25830';
    bbox = ol.proj.transformExtent([$stateParams.element.minX,
                                  $stateParams.element.minY,
                                  $stateParams.element.maxX,
                                  $stateParams.element.maxY],
									'EPSG:4326', mapProjection);

    capaKML = new M.layer.KML("KML*capaKML*" + $scope.url + "/datos/kml/"
                              + $stateParams.idCat + "/item/"
                              + $stateParams.element.pkValue + "*true");
    mapajs = M.map({
         controls:["location"],
         container:"map",
         projection: mapProjection+"*m",
         wmcfile: searchParam($scope.app.wmcURL,'wmcfile'),
         bbox: bbox,
         layers: [capaKML]
       });

    capaKML.getImpl().getOL3Layer().getSource().on('addfeature', function(e) {
	    	if(window.isIOS){
				      desc = e.feature.get('description').replace(/geo:(\-?\d+(\.\d+)?),\s?(\-?\d+(\.\d+)?)/g,
                                                          "http://maps.apple.com");
				      e.feature.set('description', desc);
			  }
        // clono para no modificar la etiqueta. Esto conlleva que al seleccionar
        // de nuevo la feature, se pierdo el texto 'Información' de la cabecera
        // y vuelta el nombre
  			f=e.feature.clone();
  			f.set('name', 'Información');
  			capaKML.getImpl().selectFeatures([f]);
  		});
});
app.controller('MapGBCtrl', function($scope, $stateParams) {
    dato = $stateParams.gbResult;
    f =  new ol.format.WKT().readFeature(dato.geom);
  	delete dato.geom;
  	f.setId(dato.solrid);
  	delete dato.solrid;
  	f.setProperties(dato);
  	bbox = f.getGeometry().getExtent();
    console.log(bbox);
  	point = ol.extent.getCenter(bbox);

    console.log(attrNotShow);
    capaJSON = new M.layer.GeoJSON({
    	name: "Información",
    	source: new ol.format.GeoJSON().writeFeatureObject(f)},
    	{hide: attrNotShow});

    mapajs = M.map({
         controls:["location"],
         container:"map",
         wmcfile: searchParam($scope.app.wmcURL,'wmcfile'),
         bbox: bbox,
         layers: [capaJSON]
       });

  	capaJSON.getImpl().getOL3Layer().setStyle(new ol.style.Style({
  	  image: new ol.style.Icon({
  	     src: 'lib/mapea/assets/img/m-pin-24-sel.svg' //NO SE PINTA!!
  	  }),
  	  text: new ol.style.Text({
  	          text: f.get('nombre'),
  	          font: 'bold 13px Helvetica, sans-serif',
  	          offsetY: -20,
  	          scale: 1,
  	          fill: new ol.style.Fill({
  	          	color: 'white'
  	          }),
  	          stroke: new ol.style.Stroke({
  	            color: 'black',
  	            width: 1.2
  	          })
  	    })
  	}));
  	capaJSON.getImpl().selectFeatures([f], point);
});
