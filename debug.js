const debugLog = true;
const debugThrow = true;


//Object to help me be consistent about logging, etc.
class DBG
{
    constructor(msg)
    {
        this.msg = msg;
        this.log(`Started ${msg}.`);
    }

    log(msg, always = false)
    {
        if(debugLog || always)
            console.log(msg);
    }

    err(e, always = false)
    {
        this.log(`Error while ${this.msg}: ${e.stack}`);
        if(debugThrow || always)
            throw(e);  
    }
}
