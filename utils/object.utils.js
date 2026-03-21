export class ObjectUtils {
    static getValue(obj, path) {
        if (typeof (path) == typeof ('')) {
            path = path.split('.');
        }
        if (path.length === 0 || typeof (obj) !== typeof ({})) {
            return obj;
        }
        const [field, ...rest] = path;
        return ObjectUtils.getValue(obj[field], rest);
    }

    static format(template, data) {
        return template.replace(/{{([^}]+)}}/g, (_, key) => {
            return ObjectUtils.getValue(data, key);
        });
    }
    
    static escapeHTML(str) {
        var p = document.createElement("p");
        p.textContent = str;
        return p.innerHTML;
    }
}