const fs = require('fs');

const axios = require('axios');




class Busquedas {
    //Propiedades
    historial = [];
    dbPath = './db/database.json';

    constructor(){
        //TODO leer db si existe
        this.leerBD();
    }

    get paramsMapbox(){
        return {
            'limit': 5,
            'language': 'es',
            'access_token': process.env.MAPBOX_KEY
        }
    }

    get HistorialCapitalizado(){

        return this.historial.map( lugar =>{
            let palabras = lugar.split(' ');
            palabras = palabras.map( p => p[0].toUpperCase() + p.substring(1) );

            return palabras.join(' ')

        })

   }

    //Metodo para buscar ( asincrona porque es se realizara peticiones http )
    async ciudad( lugar=''){

        try {
            
            //Peticion http
            
            const instance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${ lugar }.json`,
                params: this.paramsMapbox
            });

            const resp = await instance.get();
            return resp.data.features.map ( lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar .center[0],
                lat: lugar.center[1]
            }));

        } catch (error) {
            //En caso de error regresa obj vacio
            return[];
        }

    }


    get paramsWeather(){
        return {
            units: 'metric',
            lang: 'es',
            appid: process.env.OPENWEATHER_KEY
        }
    }

    async climaLugar( lat, lon ){
        try {

            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: {...this.paramsWeather, lat, lon }
            })

            const resp = await instance.get()
            const { weather, main } = resp.data;
            
            return{
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            }
            
        } catch (error) {
            console.log(error);
        }
    }

    agregarHistorial ( lugar=''){

        //TODO: Prevenir duplicado

        if ( this.historial.includes( lugar.toLocaleLowerCase() ) ){
            return;
        }

        this.historial = this.historial.splice(0,5);

        this.historial.unshift( lugar.toLocaleLowerCase() );

        //GRABAR EN DB
        this.guardarDB();

    }

    guardarDB(){

        const payload = {
            historial: this.historial
        }

        fs.writeFileSync( this.dbPath, JSON.stringify(payload))

    }

    leerBD(){

        if( !fs.existsSync(this.dbPath) ){
            return;
        }
        
        const info = fs.readFileSync(this.dbPath, { encoding: 'utf-8' });
        const data = JSON.parse( info );

        this.historial = data.historial;

    }

}

module.exports = Busquedas;