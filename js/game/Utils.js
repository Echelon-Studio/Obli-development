function random(a, b) {
    if (a > b) {
        var t = a;
        a = b;
        b = t;
    }
    var dist = Math.abs(b - a);
    return (Math.random() * dist) + a;
}