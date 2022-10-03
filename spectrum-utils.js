//SP Object hierarchy; these help with Adobe's UXP UI stuff
class SPObject 
{
    constructor(tag, id, text = "", extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPObject"); try {        
            d.log(`${[tag, id, text, extraClasses]}`);
            this.children = [];
            this.element = document.createElement(tag);
            if(id !== null)
                this.element.id = id;
            this.addClasses(extraClasses);
            this.addAttributes(extraAttributes);
            if(!(text == null))
                this.element.innerHTML += text;
            this.visible = true;
        } catch(e) { d.err(e); }
    }

    addClasses(c)
    {
        let d = new DBG(`adding classes ${c} to SPObject`); try {
            if(c == null)
                return;
            if(isString(c))
                this.element.classList.add(c);
            else if(isIterable(c))
                for(var i = 0; i < c.length; i++)
                    this.addClasses(c[i]);
            else
                throw("Unknown type in addClasses.");
        } catch(e) { d.err(e); } 
    }

    removeClasses(c)
    {
        let d = new DBG("removing classes from SPObject"); try {
            if(c == null)
                return;
            if(isString(c))
                this.element.classList.remove(c);
            else if(isIterable(c))
                for(var i = 0; i < c.length; i++)
                    this.removeClasses(c[i]);
            else
                throw("Unkown type in removeClasses");
        } catch(e) { d.err(e); } 
    }

    addAttributes(a)
    {
        let d = new DBG("adding attributes to SPObject"); try {
            if(a == null)
                return;
            for(const [key, value] of Object.entries(a))
                this.element.setAttribute(key, value);
        } catch(e) { d.err(e); } 
    }

    removeAttributes(a)
    {
        let d = new DBG("removing attributes from SPObject"); try {
            if(isString(a))
                this.element.removeAttribute(a);
            else if(isIterable(a))
                for(var i = 0; i < a.length; i++)
                    this.removeAttributes(a[i]);
            else
                throw("Unkown type in removeAttributes");
        } catch(e) { d.err(e); } 
    }

    insertChild(child, position)
    {
        let d = new DBG("inserting child into SPObject"); try {
            if(child instanceof SPObject)
            {
                let elementChildren = this.element.childNodes;
                var refNode = null;
                if(elementChildren.length > position)
                    refNode = elementChildren[position];
                this.element.insertBefore(child.element, refNode);
                this.children.push(child);
            }
            else
            {
                let elementChildren = this.element.childNodes;
                var refNode = null;
                if(elementChildren.length > position)
                    refNode = elementChildren[position];
                this.element.insertBefore(child, refNode);
            }            
        } catch(e) { d.err(e); }            
    }

    removeChild(child)
    {
        let d = new DBG("removing child from SPObject"); try {
            if(child instanceof SPObject)
                this.element.removeChild(child.element);
            else
                this.element.removeChild(child.element);
        } catch(e) { d.err(e); }            
    }

    prependChildren(child)
    {
        let d = new DBG("prepending children to SPObject"); try {
            if(isIterable(child))
                for(var i = child.length - 1; i >= 0; i--)
                    this.insertChild(child[i], 0);
            else 
                this.insertChild(child, 0)        
        } catch(e) { d.err(e); }            
    }

    addChildren(child)
    {
        let d = new DBG("adding children to SPObject"); try {
            if(isIterable(child))
                for(var i = 0; i < child.length; i++)
                    this.addChildren(child[i]);
            else if(child instanceof SPObject)
            {
                this.element.appendChild(child.element);
                this.children.push(child);
            }
            else
                this.element.appendChild(child);
        } catch(e) { d.err(e); }            
    }

    toggleVisibility(visible = !this.visible)
    {
        let d = new DBG("adding children to SPObject"); try {
            if(!visible)
            {
                this.addClasses("hideable");
                this.removeClasses("visible");
            }
            else
                this.addClasses("visible");
            this.visible = visible;
        } catch(e) { d.err(e); }            
    }

    setText(text)
    {
        let d = new DBG("adding children to SPObject"); try {
            this.element.innerHTML = text;
        } catch(e) { d.err(e); }            
    }

    clear()
    {
        if(this.children !== null) 
            for(var i = 0; i < this.children.length; i++)
                this.children[i].clear();
        this.element.innerHTML = "";
    }
};


class SPBody extends SPObject
{
    constructor(id, 
        text = "",
        extraClasses = [],
        extraAttributes = {})
    {
        let d = new DBG("building SPBody"); try {        
            super("sp-body", id, text, extraClasses, extraAttributes);
        } catch(e) { d.err(e); }
    }
}

class SPDetail extends SPObject
{
    constructor(id, text = "", extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPDetail"); try {
            super("sp-detail", id, text, extraClasses, extraAttributes);
        } catch(e) { d.err(e); }
    }
};

class SPButton extends SPObject
{
    constructor(id, 
                text = "",
                clickCallback = () => {},
                extraClasses = [],
                extraAttributes = {})
    {
        let d = new DBG("building SPButton"); try {        
            super("sp-button", id, text, extraClasses, extraAttributes);
            this.element.addEventListener("click", clickCallback);
            this.element.addEventListener("dblclick", clickCallback);
        } catch(e) { d.err(e); }
    }
};

class SPSlider extends SPObject
{
    constructor(id, 
                label = null,
                extraClasses = [],
                extraAttributes = {})
    {
        let d = new DBG("building SPSlider"); try {        

            super("sp-slider", id, "", ["slider", extraClasses], extraAttributes);
            if(label !== null)
            {
                this.label = new SPLabel("label_" + id, label, "label", {"slot": "label"});
                this.addChildren(this.label);
            }            
        } catch(e) { d.err(e); }
    }
};


class SPLabel extends SPObject
{
    constructor(id, 
                text = "",
                extraClasses = [],
                extraAttributes = {})
    {
        let d = new DBG("building SPLabel"); try {        
            super("sp-label", id, text, ["label", extraClasses], extraAttributes);
        } catch(e) { d.err(e); }
    }
};

class SPTextField extends SPObject
{
    constructor(id, 
                label = null,
                changeCallback = () => {},
                extraClasses = [],
                extraAttributes = {})
    {
        let d = new DBG("building SPTextField"); try {        
            super("sp-textfield", id, "", extraClasses, extraAttributes);
            if(label !== null)
            {
                this.label = new SPLabel("label_" + id, label, "label", {"slot": "label"});
                this.addChildren(this.label);
            }
            this.element.addEventListener("change", changeCallback);
        } catch(e) { d.err(e); }
    }
};

class SPTextArea extends SPObject
{
    constructor(id, 
                label = null,
                changeCallback = () => {},
                extraClasses = [],
                extraAttributes = {})
    {
        let d = new DBG("building SPTextArea"); try {        
            super("sp-textarea", id, "", extraClasses, extraAttributes);
            if(label !== null)
            {
                this.label = new SPLabel("label_" + id, label, "label", {"slot": "label"});
                this.addChildren(this.label);
            }
            this.element.addEventListener("change", changeCallback);
        } catch(e) { d.err(e); }
    }
};

class SPMenuItem extends SPObject
{
    constructor(id, text, extraClasses = [], extraAttributes = [])
    {
        let d = new DBG("building SPMenu"); try {
            super("sp-menu-item", id, text, extraClasses, extraAttributes)        
        } catch(e) { d.err(e); }         
    }
}

class SPMenu extends SPObject
{
    constructor(id, items, extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPMenu"); try {
            super("sp-menu", id, "", extraClasses, extraAttributes); 
            this.addChildren(items);
        } catch(e) { d.err(e); }         
    }
}

class SPDropDown extends SPObject
{
    constructor(id, items, label = null, extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPMenu"); try {
            super("sp-picker", id, "", extraClasses, extraAttributes);
            this.menu = new SPMenu(id, items, [], {"slot":"options"});
            if(label != null)
            {
                this.label = new SPLabel("label_" + id, label, "label", {"slot": "label"});
                this.addChildren(this.label);
            }
            this.addChildren(this.menu);
        } catch(e) { d.err(e); }         
    }
}


class SPTabPage extends SPObject
{
    constructor(id, title, extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPTabPage"); try {
            super("div", id, "", ["sp-tab-page", extraClasses], extraAttributes); 
            this.title = title;            
        } catch(e) { d.err(e); }         
    }
};

class SPTabs extends SPObject
{
    constructor(id, tabpages, extraClasses = [], extraAttributes = {})
    {
        let d = new DBG("building SPTabs"); try {
            super("div", id, "",["sp-tabs", extraClasses], extraAttributes);
            this.tabs = [];
            for(var i = 0; i < tabpages.length; i++)
            {
                var classes = [];
                this.addTab(
                    tabpages[i].element.id, 
                    tabpages[i].title,
                    tabpages[i].element.classList.contains("visible"));
            }
            this.tabpages = tabpages;
        } catch(e) { d.err(e); }        
    }



    addTab(id, title, selected = false)
    {
        let d = new DBG(`adding tab ${id}`); try {
            var classes = [];
            if(selected)
                classes = ["selected"];
            var tab = new SPObject("div", "tab_" + id, null,  ["sp-tab", classes]);
            tab.addChildren(new SPDetail("detail_" + tab.element.id, title));
            tab.element.onclick = () => { this._click_handler(this, tab)};
            this.addChildren(tab);
            this.tabs.push(tab);
        } catch(e) { d.err(e); }        
    }

    selectTab(id)
    {
        for(var i = 0; i < this.tabs.length; i++)
        {
            var tab = this.tabs[i]
            if(tab.element.id == id)
                tab.addClasses("selected");
            else
                tab.removeClasses("selected");

            var tabpage = this.tabpages[i];
            if(tabpage.element.id.startsWith(id.slice(4)))
                tabpage.addClasses("visible");
            else
                tabpage.removeClasses("visible");
        }
    }

    _click_handler(sptabs, tab)
    {
        let d = new DBG(`click handler for ${tab.element.id}`); try {
            localStorage.setItem("currentTab", tab.element.id);
            sptabs.selectTab(tab.element.id);
        } catch(e) { d.err(e); }        
    }
};
