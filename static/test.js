

function test_create() {
    var f = document.createElement("p");
    f.classList.add('title')  ;
    f.innerHTML = "Timasdfjkkl";    
    document.getElementById("test").appendChild(f);
}

function test_delete() {
    while (document.getElementById("test").firstChild) {
        document.getElementById("test").firstChild.remove()
    }
}



