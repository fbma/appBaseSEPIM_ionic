//******** configuración **********************//
url = "http://www.callejerodeandalucia.es/sepim/api";
urlGB = "http://geobusquedas-sigc.juntadeandalucia.es/geobusquedas/sedes"; //JGL - vacío si no tiene GB
idAplicacion = 148; //id de la aplicación
//*********************************************//
aplicacion = null;
pilaCategorias = []; //TODO: sigue?
coor_x = null;
coor_y = null;
idEntidad = null; //TODO: sigue?
datos = { //TODO: sigue?
	limit: -1,
	offset:0
};
showDistance = false; //TODO: sigue?
gbRows = 150;
M.proxy(false);
attrNotShow = [ "Geometry", "the_geom", "geom", "_version_", "solrid", "keywords", "equipamiento"];
window.isApp 	= /^(?!HTTP)/.test(document.URL.toUpperCase());
window.isIOS 	= /iPad|iPhone|iPod/.test(navigator.userAgent);
sortCategories = false;
