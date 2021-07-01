const mssql = require('mssql');
const tedious=require('tedious')


class sqlTwo {
    
    #poolT;
    #dbConfigT;

    // Handling errors
    #error = {};

     constructor(config) {
        
        try {
            this.#dbConfigT = config;
            
            this.#poolT = new mssql.ConnectionPool({
                user: this.#dbConfigT.user,
                password: this.#dbConfigT.password,
                server: this.#dbConfigT.server,
                database: this.#dbConfigT.database,
                port: this.#dbConfigT.port ? this.#dbConfigT.port : 1433,
                options: {
                    encrypt: this.#dbConfigT.encrypt ? this.#dbConfigT.encrypt : false
                }
                
            });
            
        this.#poolT.connect(err => {
                if (err) {
                    this.#error = {
                        error: true,
                        type: 'db_connection_error',
                        stack: err.stack,
                        error_message: `Something went wrong when connecting to the database ${this.#dbConfigT.database}`                        
                    }                    
                    
                   
                    console.log(this.#error) 
                    return;
                }
    
                console.log(`Connection succesfully to the database ${this.#dbConfigT.database}`);
            });  
                     
        } catch (err) {
            console.log(err,'es awu');
        }
    }
     pool= ()=>{
         return this.#poolT
     }

    executeQuery = async (queryString, paramsData = []) => {
        if (this.#handleErrors()) {
            return;
        }

        const request = await this.#poolT.request();        

        if (Array.isArray(paramsData)) {
            for (let param of paramsData) {
                try {
                    request.input(param.name, this.#getParamProcedureType(param.type), param.value);
                } catch(e) {
                    return this.#handleResponse(null, {
                        stack: e,
                        message: `The data type ${param.type} is not valid`
                    });
                }
            }
        }

        return await request.query(queryString).then(res => {
            return this.#handleResponse(res.recordsets);           
        }).catch(err => {            
            return this.#handleResponse(null, err);            
        });
    }

    executeStoredProcedure = async (storedProcedure, schema, paramsData) => {
        if (this.#handleErrors()) {
            return;
        }
        schema = schema || 'dbo';

        const request = await this.#poolT.request();        
        const paramsProcedure = await this.#getProcedureParams(schema, storedProcedure);

        for (let param in paramsData) {
            try {
                if (!paramsProcedure.data[param]) {
                    throw `Error in your stored procedure ${schema}.${storedProcedure}`;
                }

                paramsProcedure.data[param].value = paramsData[param];
                request.input(paramsProcedure.data[param].name, paramsProcedure.data[param].type, paramsProcedure.data[param].value);
            } catch (e) {
                return this.#handleResponse(null, {
                    stack: e,
                    message: `The param ${param} is not declared in your procedure ${schema}.${storedProcedure}`
                });
            }
        }        
                
        return request.execute(`${schema}.${storedProcedure}`).then(res => {
            return this.#handleResponse(res.recordsets);
        }).catch(err => {   
            return this.#handleResponse(null, err);            
        });
    }

    #getProcedureParams = async (schema, storedProcedure) => {
        return this.#poolT.request()
            .input('procedure_name', mssql.VarChar, storedProcedure)
            .execute('sp_sproc_columns').then(res => {                
                const params = [];

                if (res.recordset.length < 0) {
                    return this.#handleResponse(null, {
                        stack: `Error in your stored procedure ${schema}.${storedProcedure}`,
                        message: `The stored procedure ${schema}.${storedProcedure} does not exists`
                    })
                }

                for (let record of res.recordset) {
                    if (record.COLUMN_NAME != '@RETURN_VALUE') {
                        const param = record.COLUMN_NAME.replace('@', '');
                        
                        params[param] = {
                            name: param,
                            type: this.#getParamProcedureType(record.TYPE_NAME),  
                            value: this.#getParamProcedureDefaultValue(record)
                        }
                    }
                }

                return this.#handleResponse(params);                
        }).catch(err => {     
            return this.#handleResponse(null, err);            
        });
    }

    #getParamProcedureType = (typeName) => {
        let type = null;
        
        switch (typeName.toLocaleLowerCase()) {            
            case 'tinyint':
                type = mssql.TinyInt;
                
                break;
            case 'smallint':
                type = mssql.SmallInt;
                
                break;
            case 'int':
                type = mssql.Int;
                
                break;
            case 'bigint':
                type = mssql.BigInt;
                
                break;
            case 'decimal':
                type = mssql.Decimal;
                
                break;
            case 'numeric':
                type = mssql.Numeric;
                
                break;
            case 'float':
                type = mssql.Float;

                break;
            case 'money':
                type = mssql.Money;
                
                break;
            case 'smallmoney':
                type = mssql.SmallMoney;
                                
                break;

            case 'datetime':
            case 'date':
            case 'time':
            case 'varchar':
            case 'char':
            case 'text':
            case 'nchar':
            case 'nvarchar':
            case 'ntext':
            case 'blob':
                type = mssql.NVarChar;
            
                break;
            case 'bit':
                type = mssql.Bit;

                break;
        }

        return type;
    }

    #getParamProcedureDefaultValue = (record) => {
        let defaultValue = null;

        if (record.COLUMN_NAME == '@start') {
            defaultValue = 0;
        }

        if (record.COLUMN_NAME == '@limit') {
            defaultValue = 100;
        }

        if (record.COLUMN_NAME == '@page') {
            defaultValue = 1;
        }

        switch (record.TYPE_NAME) {
            case 'bigint':
            case 'int':
            case 'smallint':
            case 'tinyint':
            case 'bit':
            case 'decimal':
            case 'numeric':
            case 'money':
            case 'smallmoney':
            case 'float':
                defaultValue = 0;

                break;
            case 'datetime':
                defaultValue = '1900-01-01 00:00:00';

                break;
            case 'date':
                defaultValue = '1900-01-01';

                break;
            case 'time':
                defaultValue = '00:00:00';

                break;
            case 'varchar':
            case 'char':
            case 'text':
            case 'nchar':
            case 'nvarchar':
            case 'ntext':
            case 'blob':
                defaultValue = '';

                break;        
        }

        return defaultValue;
    }

    #handleResponse = (data, error) => {        
        let response = {
            success: !error ? true: false,
            error: error ? true : false,
            data: !error ? data : null,
            itemsByPage: (!error && data.length > 0 && data[0].itemsByPage) ? data[0].itemsByPage : 0
        };

        
        if (error) {
            response.errorDetail = error.stack;
            response.message = error.message;
        }
        
        return response;
    }    

    #handleErrors = () => {
        let existError = false;

        switch (this.#error.type) {
            case 'db_connection_error':
                existError = true;    

                break;        
        } 

        if (existError) {
            console.log(this.#error.type);
        }

        return existError;
    }
}

module.exports = sqlTwo;
