const NPCWanderRange = 50;
const NPCMaxWaitTime = 5000;
const NPCMinWaitTime = 500;
const movementSpeed = 30;
var NPCs = [];
var NPCObjects = [];

function NPC(creature){
    this.object = creature;
    this.goal = new THREE.Vector3();
    var waitTime = random(NPCMinWaitTime, NPCMaxWaitTime);
    var lastTime = performance.now();

    var generateGoal = function(goal, objectPos){
        goal.copy(objectPos);

        goal.x += random(-NPCWanderRange, NPCWanderRange);
        goal.z += random(-NPCWanderRange, NPCWanderRange);

    };

    generateGoal(this.goal, this.object.position);

    var waiting = false;

    this.think = function(delta) {
        var distance = this.goal.distanceTo(this.object.position);
        if (!waiting) {
            waiting = true;
            //console.log(this.object + " has began waiting");
            lastTime = performance.now();
            waitTime = random(NPCMinWaitTime, NPCMaxWaitTime);
        } else {
            if (distance <= 20) {
                if (performance.now() - lastTime >= waitTime) {
                    waiting = false;
                    generateGoal(this.goal, this.object.position);
                    //console.log(this.object + " stopped waiting");
                }
            } else {
                var direction = (new THREE.Vector3()).copy(this.object.position);
                direction.sub(this.goal);
                //direction.normalize();
                direction.x = -Math.sign(direction.x);
                direction.z = -Math.sign(direction.z);
                direction.x = direction.x * Math.min(Math.abs(this.goal.x - this.object.position.x), movementSpeed * delta);
                direction.z = direction.z * Math.min(Math.abs(this.goal.z - this.object.position.z), movementSpeed * delta);
                this.object.position.add(direction);
                //console.log(this.object + "is moving");
            }
        }
    }
}