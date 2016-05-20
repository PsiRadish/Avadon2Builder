
// Find a better place for this later
if (!String.format) 
{
    String.format = function(format)
    {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/\{(\d+)\}/g, function(match, number)
        {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    };
}

/**
 * TargetType
 */
var TargetType =
{
    Melee:      "Melee Attack",
    Close:      "Close Attack",
    Missile:    "Missile",
    MagMissile: "Magical Missile",
    Self:       "Affects Self",
    Ally:       "Affects Single Ally",
    NearAllies: "Affects Nearby Allies",
    NearFoes:   "Affects Nearby Foes",
    NearAll:    "Affects Everyone Nearby",
    Cone:       "Cone Attack",
    Area:       "Area Attack",
    Passive:    "Passive"
}

/**
 * Skill
 */
function Skill(name, maxLevel) //, upgrade1, upgrade2, upgrade2Name)
{
    this.name = name;
    this.maxLevel = maxLevel || 10;
    
    this.levelCosts = [0, 2];
    for (var i = 1; i < maxLevel; i++)
    {
        this.levelCosts.push(1);
    };
    
    this.baseAbility = null;
    this.baseDescription = "";
    
    this.upgrade1Level = null; // upgrade1 || null;
    this.upgrade1Description = null;
    
    this.upgrade2Level = null; // upgrade2 || null;
    this.upgradeAbility = null;
    this.upgrade2Name = null; // upgrade2Name || null;
    this.upgrade2Description = null;
    
    // ...
}

/**
 * Ability
 */
function Ability(name, targetType)
{
    this.name = name;
    this.icon = null;
    
    this.baseDescription = "";
    
    this.fatigue = null;
    this.cooldown = null;
    
    this.baseTarget = targetType;
    this.baseEffects = [];
    
    this.upgrade1Level = null;
    this.upgrade1Description = null;
    this.upgrade1Target = null;
    this.upgrade1Effects = [];
    
    this.upgrade2Level = null;
    this.upgrade2Description = null;
    this.upgrade2Target = null;
    this.upgrade2Effects = [];
}
Ability.prototype.textForLevel = function(level)
{
    var textData =
    {
        name: this.name,
        description: [this.baseDescription],
        
        targeting: this.baseTarget
        
        // costAndCooldown: `Fatigue: ${this.fatigue}. Turns to recover: ${this.cooldown}.`
    };
    
    if (this.fatigue && this.cooldown)
        textData.costAndCooldown = `Fatigue: ${this.fatigue}. Turns to recover: ${this.cooldown}.`;
    
    var effectList = this.baseEffects;
    
    var upgrade = (level >= this.upgrade2Level) ? 2 : (level >= this.upgrade1Level) ? 1 : 0;
    
    if (upgrade >= 1)
    {
        if (this.upgrade1Description)
            textData.description.push(this.upgrade1Description);
        
        if (this.upgrade1Target)
            textData.targeting = this.upgrade1Target;
        
        effectList = effectList.concat(this.upgrade1Effects);
    }
    if (upgrade == 2)
    {
        if (this.upgrade2Description)
            textData.description.push(this.upgrade2Description);
        
        if (this.upgrade2Target)
            textData.targeting = this.upgrade2Target;
        
        effectList = effectList.concat(this.upgrade2Effects);
    }
    
    textData.effects = effectList.map(function(effect)
    {
        return effect.textForLevel(level);
    });
    
    return textData;
};

/**
 * Effect
 */
function Effect(formatString)
{
    this.formatString = formatString;
}
Effect.prototype.textForLevel = function(level)
{
    return this.formatString;
};


////// POPULATE GAME DATA

var Avadon2 = {};

/// SKILLS
Avadon2.Skills = {};

// enclose to avoid cluttering global scope with temp vars
(function()
{
    var newSkill;
    var newBaseAbility;
    var newUpgradeAbility;
    
    // 
    // Melee Training
    newSkill = new Skill("Meelee Training", 10);
    newBaseAbility = new Ability(newSkill.name, TargetType.Meelee);
    
    newSkill.icon = newBaseAbility.icon = "icon-dummy";
    newBaseAbility.icon = "icon-basic-melee";
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your melee attacks more likely to hit and do more damage.";
    newBaseAbility
    
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level chance for attacks to also hit a nearby enemy.";
    
    
     = "Stunning Bash";
     = "Delivers a vicious blow with your blade, doing more damage and stunning the target.";
})();

/// ABILITIES
// Avadon2.Abilities = {};

