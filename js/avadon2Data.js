
/**
 * Global constants
 */
// MAXPOINTS
Object.defineProperty(window, 'MAXPOINTS',
{
    value: 58,
    writable: false
});
// MAXSPECIALIZATION
Object.defineProperty(window, 'MAXSPECIALIZATION',
{
    value: 3,
    writable: false
});


// temp placeholder vars
var __MANA_COST__ = 0;
var __COOLDOWN__ = 0;
var __TARGET_TYPE__ = "Affects Something-Something";


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
 * TreeNode
 */
function TreeNode()
{
    this._skill = null;
    this.icon = null;
    
    this.level = 0;
    
    this.specMod = 0;
    this.itemMod = 0;
    
    this._directAncestors = [];
    this._directDescendants = [];
}
// Property: skill
Object.defineProperty(TreeNode.prototype, 'skill',
{
    get: function()
    {
        return this._skill;
    },
    set: function(newSkill)
    {
        this._skill = newSkill;
        this.icon = newSkill.icon;
        this.level = newSkill.minLevel;
    }
    enumerable: true
});
// Property: isSpecNode
Object.defineProperty(TreeNode.prototype, 'isSpecNode',
{
    get: function()
    {
        return !this._skill;
    },
    enumerable: true
});
// Property: moddedLevel
Object.defineProperty(TreeNode.prototype, 'moddedLevel',
{
    get: function()
    {
        return this.level + this.specMod + this.itemMod;
    },
    enumerable: true
});
// Property: thisLevelCost
Object.defineProperty(TreeNode.prototype, 'thisLevelCost',
{
    get: function()
    {
        if (this.isSpecNode) // specialization node
        {
            return (this.level == 0) ? 0 : 1;
        }
        
        if (this.level == this.skill.minLevel)
            return 0;
        
        return this.skill.levelCosts[this.level];
    },
    enumerable: true
});
// Property: nextLevelCost
Object.defineProperty(TreeNode.prototype, 'nextLevelCost',
{
    get: function()
    {
        if (this.isSpecNode) // specialization node
        {
            if (this.level + 1 > MAXSPECIALIZATION)
                return Number.POSITIVE_INFINITY;
            
            return 1;
        }
        
        if (this.level + 1 > this.skill.maxLevel)
            return Number.POSITIVE_INFINITY;
        
        return this.skill.levelCosts[this.level + 1];
    },
    enumerable: true
});
TreeNode.prototype._getAllAncestors = function()
{
    var all = this._directAncestors.slice();
    
    this._directAncestors.forEach(function(ancestor)
    {
        all = all.concat(ancestor._getAllAncestors());
    });
    
    return all;
}
TreeNode.prototype._getAllDescendants = function()
{
    var all = this._directDescendants.slice();
    
    this._directDescendants.forEach(function(descendant)
    {
        all = all.concat(descendant._getAllDescendants());
    });
    
    return all;
}
TreeNode.prototype.increaseOkay = function()
{
    var newLevel = this.level + 1;
    
    if (this.isSpecNode) // specialization node
    {
        return !(newLevel > MAXSPECIALIZATION);
    }
    
    if (newLevel > this.skill.maxLevel)
        return false;
    
    return  this._getAllAncestors().every(function(ancestor)
            {
                return ancestor.level >= newLevel;
            }); // still returns true for an empty ancestors array
}
TreeNode.prototype.decreaseOkay = function()
{
    var newLevel = this.level - 1;
    
    if (this.isSpecNode) // specialization node
    {
        return !(newLevel < 0);
    }
    
    if (newLevel < this.skill.minLevel)
        return false;
    
    return  this._getAllDescendants().every(function(descendant)
            {
                return descendant.level <= newLevel;
            }); // still returns true for an empty descendants array
}

/**
 * SkillTree
 */
function SkillTree()
{
    this.Battle  =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Power   =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Utility =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Master  =  [new TreeNode(), new TreeNode()];
    this.Orphan  =  [new TreeNode(), new TreeNode()];
    
    this.Specializations =
    {
        Battle: new TreeNode(),
        Power: new TreeNode(),
        Utility: new TreeNode()
    }
    
    // Define bi-directional node relationships
    this.Battle[0]._directDescendants   = [ this.Battle[1], this.Power[1] ];
    this.Battle[1]._directDescendants   = [ this.Battle[2] ];
    this.Battle[1]._directAncestors     = [ this.Battle[0], this.Power[0] ];
    this.Battle[2]._directDescendants   = [ this.Master[0] ];
    this.Battle[2]._directAncestors     = [ this.Battle[1], this.Power[1] ];
    
    this.Power[0]._directDescendants    = [ this.Battle[1], this.Utility[1] ];
    this.Power[1]._directDescendants    = [ this.Battle[2], this.Power[2] ];
    this.Power[1]._directAncestors      = [ this.Battle[0], this.Utility[0] ];
    this.Power[2]._directAncestors      = [ this.Power[1] ];
    
    this.Utility[0]._directDescendants  = [ this.Power[1], this.Utility[1] ];
    this.Utility[1]._directDescendants  = [ this.Utility[2] ];
    this.Utility[1]._directAncestors    = [ this.Power[0], this.Utility[0] ];
    this.Utility[2]._directDescendants  = [ this.Master[1] ];
    this.Utility[2]._directAncestors    = [ this.Utility[1] ];
    
    this.Master[0]._directAncestors     = [ this.Battle[2] ];
    this.Master[1]._directAncestors     = [ this.Utility[2] ];
}
SkillTree.prototype.init = function(skills)
{   
    // Assign skills to nodes
    this.Battle[0].skill = skills[0];
    this.Battle[1].skill = skills[1];
    this.Battle[2].skill = skills[2];
    
    this.Power[0].skill = skills[3];
    this.Power[1].skill = skills[4];
    this.Power[2].skill = skills[5];
    
    this.Utility[0].skill = skills[6];
    this.Utility[1].skill = skills[7];
    this.Utility[2].skill = skills[8];
    
    this.Master[0].skill = skills[9];
    this.Master[1].skill = skills[10];
    
    this.Orphan[0].skill = skills[11];
    this.Orphan[1].skill = skills[12];
    
    this.Specializations.Battle.icon = this.Battle[0].skill.icon;
    this.Specializations.Power.icon = this.Power[0].skill.icon;
    this.Specializations.Utility.icon = this.Utility[0].skill.icon;
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
function Skill(name, icon, maxLevel, minLevel) //, upgrade1, upgrade2, upgrade2Name)
{
    this.name = name;
    this.icon = icon;
    
    this.maxLevel = maxLevel || 10;
    this.minLevel = minLevel || 0;
    
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
    this.upgrade2Name = null; // upgrade2Name || null;
    this.upgradeAbility = null;
    this.upgrade2Description = null;
}
// Packages relevant text for insertion into markup.
Skill.prototype.getInfo = function()
{
    var info =
    {
        name: this.name,
        icon: this.icon,
        
        description: this.baseDescription
    };
    
    info.upgrades = [];
    
    if (this.upgrade1Level)
    {
        info.upgrades.push(
        {
            when: `At level ${ this.upgrade1Level }:`,
            description: this.upgrade1Description
        });
    }
    if (this.upgrade2Level)
    {
        info.upgrades.push(
        {
            when: `At level ${ this.upgrade2Level }${ (this.upgrade2Name) ? ", gain" : "" }:`,
            name: this.upgrade2Name,
            description: this.upgrade2Description
        });
    }
    
    return info;
};

/**
 * Ability
 */
function Ability(name, icon, targetType, minLevel)
{
    this.name = name;
    this.icon = icon;
    this.minLevel = minLevel || 1;
    
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
Ability.prototype.getInfoForLevel = function(level)
{
    var info =
    {
        name: this.name,
        icon: this.icon,
        
        description: [this.baseDescription],
        
        targeting: this.baseTarget
    };
    
    if (this.fatigue && this.cooldown)
        info.costAndCooldown = `Fatigue: ${this.fatigue}. Turns to recover: ${this.cooldown}.`;
    
    var effectList = this.baseEffects;
    
    var upgrade = (level >= this.upgrade2Level) ? 2 : (level >= this.upgrade1Level) ? 1 : 0;
    if (upgrade >= 1)
    {
        if (this.upgrade1Description)
            info.description.push(this.upgrade1Description);
        
        if (this.upgrade1Target)
            info.targeting = this.upgrade1Target;
        
        effectList = effectList.concat(this.upgrade1Effects);
    }
    if (upgrade == 2)
    {
        if (this.upgrade2Description)
            info.description.push(this.upgrade2Description);
        
        if (this.upgrade2Target)
            info.targeting = this.upgrade2Target;
        
        effectList = effectList.concat(this.upgrade2Effects);
    }
    
    info.effects = effectList.map(function(effect)
    {
        return effect.getInfoForLevel(level);
    });
    
    if (level < this.minLevel)
        info.lockedMsg = "Your skills aren't high enough to use this ability.";
    
    return info;
};

/**
 * Effect
 */
function Effect(formatString)
{
    this.formatString = formatString;
}
Effect.prototype.getInfoForLevel = function(level)
{
    return this.formatString;
};


////// POPULATE GAME DATA

/*
Battle Specialization
Each level of battle specialization increases the three skills in the left column by one.
These skills tend to involve directly damaging your foes.

Power Specialization
Each level of power specialization increases the three skills in the center column by one.
These skills tend to make your other attacks more effective and protect you from enemy attacks.

Utility Specialization
Each level of utility specialization increases the three skills in the right column by one.
These skills tend to bless or cure your allies, curse your enemies, or do other generally useful things.
*/

////// CLASSES
var Classes =
{
    Blade:
    {
        name: "Blademaster",
        dollImg: "class-dolls-tinker",
        skills: []
    },
    Shadow:
    {
        name: "Shadowwalker"
        dollImg: "class-dolls-tinker",
        skills: []
    },
    Shaman:
    {
        name: "Shaman"
        dollImg: "class-dolls-tinker",
        skills: []
    },
    Sorc:
    {
        name: "Sorcerer"
        dollImg: "class-dolls-tinker",
        skills: []
    },
    Tinker:
    {
        name: "Tinker"
        dollImg: "class-dolls-tinker",
        skills: []
    }
};

// enclose to avoid cluttering global scope with temp vars
(function()
{
    var newSkill;
    var newBaseAbility;
    var newUpgradeAbility;
    
  //// == BLADEMASTER - BATTLE ==
    
  //// -- Melee Training --
    newSkill = new Skill("Melee Training", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your melee attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level chance for attacks to also hit a nearby enemy.";
    newBaseAbility.upgrade1Effects = [new Effect("Physical damage to foe near target. (Chance)")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Stunning Bash";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Melee, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Delivers a vicious blow with your blade, doing more damage and stunning the target.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 8;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Physical damage."),
        new Effect("Stunned for 2 Turns.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// -- Archery Training --
    newSkill = new Skill("Archery Training", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-ranged", TargetType.Missile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your bow attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Each level gives 5% higher chance of a critical hit.";
    newBaseAbility.upgrade1Effects = [new Effect("Increased crit chance.")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Sharpshooter Spray";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Area, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fires a rapid spray of arrows, striking everyone in an area.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 10;
    newUpgradeAbility.baseEffects = [new Effect("Physical damage.")];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Hamstring --
    newSkill = new Skill("Hamstring", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Delivers a nasty blow with your blade, damaging and ensnaring the target.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects =
    [
        new Effect("Physical damage."),
        new Effect("Ensnared for 3 Turns.")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also slows the target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Berserk Leap";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.MagMissile, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Leaps to a foe, doing damage and dazing and knocking it back.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 8;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Leap to target."),
        new Effect("Physical damage."),
        new Effect("Knockback 3 spaces."),
        new Effect("Dazed for 2 Turns.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// == BLADEMASTER - POWER ==
  
  //// -- Path of the Shield --
    newSkill = new Skill("Path of the Shield", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases resistance to magical damage by 3%/level.";
    // newBaseAbility.baseEffects = [ new Effect("__EFFECT__") ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 4%/level chance to parry melee and missile attacks.";
    // newBaseAbility.upgrade1Effects = [ new Effect("__EFFECT__") ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 6%/level chance to riposte melee and missile attacks.";
    // newBaseAbility.upgrade2Effects = [ new Effect("__EFFECT__") ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Path of the Blade --
    newSkill = new Skill("Path of the Blade", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Adds 5%/level damage to melee and missile attacks.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level effectiveness to battle blessings and curses.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 5%/level chance of critical damage.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Path of the Berserker --
    newSkill = new Skill("Path of the Berserker", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases health by 5% per level.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 3%/level chance of starting to regenerate when struck in melee.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 10%/level of attacker in battle receiving a random curse.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == BLADEMASTER - UTILITY ==

  //// -- Second Wind --
    newSkill = new Skill("Second Wind", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Self);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Heals damage the blademaster has suffered.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also causes the blademaster to regenerate for a brief time.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Recovery";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Self, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Instantly recover from several curses or afflictions.";
    newUpgradeAbility.fatigue = 1;
    newUpgradeAbility.cooldown = 12;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- War Cry --
    newSkill = new Skill("War Cry", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.NearFoes);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "A terrifying howl inflicts War Curse on all nearby foes.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "The howl also inflicts Weakness Curse.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Terrifying Howl";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearFoes, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "The blademaster's scream terrifies all nearby enemies.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 12;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Warrior's Focus --
    newSkill = new Skill("Warrior's Focus", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Self);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Gives the blademaster a Mindshield, providing resistance to all mental attacks.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 10;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also causes the blademaster to partially reflect attack spells.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Battle Frenzy";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Self, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "The blademaster goes into a frenzy, gaining extra attacks for several rounds.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 14;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Battle Frenzy for 4 Turns.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// == BLADEMASTER - MASTER ==

  //// -- Blade Sweep --
    newSkill = new Skill("Blade Sweep", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.NearFoes);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "A mighty swing of the blademaster's weapon damages all nearby foes.";
    newBaseAbility.fatigue = 2;
    newBaseAbility.cooldown = 10;
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also inflicts Weakness Curse on nearby foes.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Berserker Slash";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearFoes, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "A mighty swing of the blademaster's weapon damages all nearby foes, stuns them, and knocks them back.";
    newUpgradeAbility.fatigue = 3;
    newUpgradeAbility.cooldown = 14;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Physical damage."),
        new Effect("__EFFECT__"),
        new Effect("__EFFECT__"),
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Triumphant Roar --
    newSkill = new Skill("Triumphant Roar", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.NearAllies);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "A rallying cry gives all nearby allies Haste and War Chant.";
    newBaseAbility.fatigue = 2;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also cures nearby allies of mental statuses (like Charm).";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Call of the Frenzy";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearAllies, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "A rallying cry drives nearby allies into a frenzy, giving them extra attacks.";
    newUpgradeAbility.fatigue = 3;
    newUpgradeAbility.cooldown = 15;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// == BLADEMASTER - ORPHAN ==

  //// -- Challenge --
    newSkill = new Skill("Challenge", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.NearFoes);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Let out a berserk roar. You will regenerate and be shielded briefly, and nearby enemies are more likely to attack the blademaster.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 6;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Savage Blow --
    newSkill = new Skill("Savage Blow", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Delivers a vicious blow with your blade, doing more damage than normal.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 6;
    newBaseAbility.baseEffects =
    [
        new Effect("Physical damage.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Blade.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// == SHADOWWALKER - BATTLE ==
    
  //// -- Blade Training --
    newSkill = new Skill("Blade Training", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your melee attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Gives a chance of your melee attacks poisoning the target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Blade Whirlwind";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearFoes, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "You whirl around and deliver a series of vicious blows, striking all nearby enemies.";
    newUpgradeAbility.fatigue = 1;
    newUpgradeAbility.cooldown = 8;
    newUpgradeAbility.baseEffects = [new Effect("Physical damage.")];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Razordisk Training --
    newSkill = new Skill("Razordisk Training", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-ranged", TargetType.Missile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your razordisk attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Gives each razordisk you throw a 5% chance/level of also damaging a second foe.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Razor Spray";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Cone, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fling a handful of razordisks, damaging all foes in a cone-shaped area.";
    newUpgradeAbility.fatigue = 1;
    newUpgradeAbility.cooldown = 10;
    newUpgradeAbility.baseEffects = [new Effect("Physical damage.")];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Searing Pot --
    newSkill = new Skill("Searing Pot", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.MagMissile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Fling a small orb full of acid, burning the target.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects = [new Effect("Acid damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also causes acid damage to the foe over the next several rounds.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Lightning Pot";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.MagMissile, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fling a small orb full of a foul, caustic substance, burning the target and causing lasting corruption damage.";
    newUpgradeAbility.fatigue = 1;
    newUpgradeAbility.cooldown = 12;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Acid damage.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHADOWWALKER - POWER ==
    
  //// -- Steel Discipline --
    newSkill = new Skill("Steel Discipline", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Gives a 5%/level backstab bonus to melee attacks against a foe with another of your allies next to it.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a 5%/level chance to riposte melee attacks.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Add an 8%/level chance of entering a battle frenzy when struck in melee.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Earth Discipline --
    newSkill = new Skill("Earth Discipline", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Gives 4%/level resistance to magical and elemental attacks.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level resistance to physical damage.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Add 10%/level resistance to mental, poison and acid attacks.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Lightning Discipline --
    newSkill = new Skill("Lightning Discipline", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Gives 5%/level additional damage to all weapon attacks.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level to chance of getting critical hits.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds +5%/level chance to hit with all melee attacks.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHADOWWALKER - UTILITY ==
    
  //// -- Healing Focus --
    newSkill = new Skill("Healing Focus", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Self);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Heals damage the shadowwalker has suffered.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also cures one curse or hostile status.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Recovery";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Self, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Instantly recover from several curses or afflictions.";
    newUpgradeAbility.fatigue = 1;
    newUpgradeAbility.cooldown = 12;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Shadowstep --
    newSkill = new Skill("Shadowstep", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.NearFoes);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Create a cloud of harsh smoke, stunning all nearby enemies. Then leap to a new location.";
    newBaseAbility.fatigue = 1;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also ensnares all nearby enemies.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Cunning Decoy";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Self, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Creates a decoy of the shadowwalker, absorbing enemy attacks. Then leap to a new location.";
    newUpgradeAbility.fatigue = 3;
    newUpgradeAbility.cooldown = 14;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Shadowwalker's Focus --
    newSkill = new Skill("Shadowwalker's Focus", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Self);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Speeds up the shadowwalker and causes all melee attackers to suffer physical damage.";
    newBaseAbility.fatigue = 2;
    newBaseAbility.cooldown = 10;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also grants regeneration.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Bladeshield";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Self, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "For a short time, all damage is dramatically reduced and most melee attacks are riposted.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 15;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHADOWWALKER - MASTER ==
    
  //// -- Shattering Blow --
    newSkill = new Skill("Shattering Blow", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Delivers a vicious blow, stunning and knocking back the target.";
    newBaseAbility.fatigue = 2;
    newBaseAbility.cooldown = 8;
    newBaseAbility.baseEffects =
    [
        new Effect("Physical damage.")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also gives a chance of striking another nearby foe.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Steel Tornado";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearFoes, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Become a lethal whirlwind of destruction. Attack speed is doubled, and all nearby foes are struck by your blade.";
    newUpgradeAbility.fatigue = 3;
    newUpgradeAbility.cooldown = 12;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Physical damage.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Flash Powder --
    newSkill = new Skill("Flash Powder", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Throw a cloud of choking dust into the air. The actions of all nearby foes are slowed.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Nearby foes are also ensnared.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Stunning Powder";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Throw a cloud of burning dust into the air. All nearby foes are stunned.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHADOWWALKER - ORPHAN ==
    
  //// -- Locksmith --
    newSkill = new Skill("Locksmith", "icon-dummy", 4, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Reduces the number of lockpicks that are required whenever your group attempts to pick a lock or disarm a trap. Makes attacks against mines and turrets far more effective.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Disarming Blow --
    newSkill = new Skill("Disarming Blow", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Delivers a nasty blow to one foe and causes its attacks to be weaker for a short time.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shadow.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHAMAN - BATTLE ==
    
  //// -- Spirit Claw --
    newSkill = new Skill("Spirit Claw", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.MagMissile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Slashes a nearby foe with the claws of a spirit wolf. Can even harm enemies at a distance.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a chance of also slashing a foe near your target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Spirit Charge";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fills an area with a wave of force, slashing your enemies and making them vulnerable to magical attacks.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Poison Mist --
    newSkill = new Skill("Poison Mist", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Creates a rain of poison mist, damaging everyone in an area.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also does poison damage to the targets over the next several rounds.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Acid Shower";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Creates a rain of acid in an area, damaging the victims both immediately and over the next several rounds.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Call the Winds --
    newSkill = new Skill("Call the Winds", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Buffets a single target with icy winds, damaging the target, knocking it back, and immobilizing it.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also curses the target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Call the Storm";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Sends out a cone of icy wind, damaging your foes, knocking them back, and ensnaring them.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHAMAN - POWER ==
    
  //// -- Hardiness --
    newSkill = new Skill("Hardiness", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases your health by 4%/level.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 6%/level resistance to acid, poison, and cold.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 12%/level resistance to magic and fire.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Beast Focus --
    newSkill = new Skill("Beast Focus", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Every level of this skill adds 1 level to all summoned creatures.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Summoned pets appear with War Chant.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Summoned pets appear with Haste.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Nature Mastery --
    newSkill = new Skill("Nature Mastery", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases all magical damage by +4%/level.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also increases effectiveness of healing by 8%/level.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Also increases effectiveness of all blessings and curses by 10%/level.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHAMAN - UTILITY ==
    
  //// -- Call Wolf --
    newSkill = new Skill("Call Wolf", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Summons a wolf from the wilds to fight beside you.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "The wolf appears with the Curse Howl ability.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Call Hellhound";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Summons a fiery hellhound from the wilds to fight beside you.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Healing Touch --
    newSkill = new Skill("Healing Touch", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Summons the power of nature to heal one ally.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also removes one curse or hostile effect.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Group Heal";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Summons the power of nature to heal all nearby allies.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Blessing of Thorns --
    newSkill = new Skill("Blessing of Thorns", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Surrounds all nearby allies with a shield of thorns, damaging attackers.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also cures one hostile status effect for each nearby ally.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Reflection";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Raise a powerful protective ward, reflecting magical damage back at the enemy caster.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHAMAN - MASTER ==
    
  //// -- Earthquake --
    newSkill = new Skill("Earthquake", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Causes the earth nearby to shake powerfully, damaging all nearby foes.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Increases the range of the earthquake.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Earthshatter";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Causes the earth nearby to buck uncontrollably, damaging foes, knocking them back, and stunning them.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Call Salamander --
    newSkill = new Skill("Call Salamander", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Summons a fiery lizard to fight at your side.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Lizard has the ability to summon a cloud of fire.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Call Drake";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Summons a powerful drake to fight by your side.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SHAMAN - ORPHAN ==
    
  //// -- Revive Servant --
    newSkill = new Skill("Revive Servant", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Summons the power of nature to heal damage suffered by your pet.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Healing Chant --
    newSkill = new Skill("Healing Chant", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Summons the power of nature to heal one ally.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Shaman.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SORCERER - BATTLE ==
    
  //// -- Firebolt --
    newSkill = new Skill("Firebolt", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.MagMissile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Flings a bolt of fire at a single foe.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a chance that the flames will cause a critical hit.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Icy Lance";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Flings a powerful bolt of ice at a single foe.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Lightning Wind --
    newSkill = new Skill("Lightning Wind", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Shoots out a cone of lightning, shocking your enemies.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a chance that the lightning will also temporarily weaken the targets.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Steel Wind";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Flings out a cone of razor-sharp shards, doing high physical damage to your foes.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Ice Storm --
    newSkill = new Skill("Ice Storm", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Causes a rain of ice, damaging all foes in an area.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a chance that the snow will also slow the enemies.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Firestorm";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Creates a rain of fire in an area, inflicting high fire damage on your foes.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SORCERER - POWER ==
    
  //// -- Ward Mastery --
    newSkill = new Skill("Ward Mastery", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Gives 3%/level resistance to physical damage.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 8%/level resistance to mental attacks.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 10%/level resistance to magic and elemental attacks.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Focus Mastery --
    newSkill = new Skill("Focus Mastery", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Adds 5%/level to chance of inflicting critical damage.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 3%/level chance of damaging and stunning anyone who strikes you in melee.";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "You will absorb 10%/level magical or elemental damage and use the power to regain your abilities.";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Magical Mastery --
    newSkill = new Skill("Magical Mastery", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases chance for all spells to hit by +5%/level.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
"At Level 7:";
"Adds 10%/level chance of reducing the time to recharge your abilities.";

  //// == SORCERER - UTILITY ==
    
  //// -- Daze --
    newSkill = new Skill("Daze", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Dazes all enemies in an area, leaving them unable to act for a time (unless you damage them).";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Increase the area of effect of the Daze spell.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Charm Foe";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Take control of the mind of a foe, causing it to fight for you for a short time.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Arcane Blessing --
    newSkill = new Skill("Arcane Blessing", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Self);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Grants resistance to magical, elemental, poison, and acid attacks for a short time.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "The resistance granted by Arcane Blessing helps your entire party.";
    newBaseAbility.upgrade1Target = TargetType.NearAllies;
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Haste";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.NearAllies, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "All nearby allies are Hasted. For a short time, when they attack, they have a chance of being able to attack a second time.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Arcane Curse --
    newSkill = new Skill("Arcane Curse", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Places a War Curse on all nearby foes, making their attacks less effective.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also inflicts Weakness Curse on your nearby foes.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Slow";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Slows all nearby foes, gives them a chance of missing their turns in combat.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SORCERER - MASTER ==
    
  //// -- Searing Spray --
    newSkill = new Skill("Searing Spray", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Fires out a cone of acid spray, damaging your foes.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Also leaves its victims taking acid damage over the next several rounds.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Corrupting Cloud";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Rains down a cloud of corruption, doing a lot of acid damage to foes in an area.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Cloud of Confusion --
    newSkill = new Skill("Cloud of Confusion", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Confuses all nearby foes, causing them to act randomly in battle.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Increases the radius of Cloud of Confusion.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Assault Blessing";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Hastes all nearby allies and causes them to reflect magical damage back at enemy casters.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == SORCERER - ORPHAN ==
    
  //// -- Unlock Charm --
    newSkill = new Skill("Unlock Charm", "icon-dummy", 4, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Reduces the number of lockpicks that are required whenever your group attempts to pick a lock or disarm a trap.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Shadow Charm --
    newSkill = new Skill("Shadow Charm", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Causes nearby enemies to forget that you are there, giving them a chance to switch to a new target (if there is one). Also gives a powerful shield for a short time.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Sorc.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == TINKERMAGE - BATTLE ==
    
  //// -- Blade Training --
    newSkill = new Skill("Blade Training", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.Melee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your melee attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a chance that your blade will squirt acid onto your foe.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Bladelash";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "A powerful attack that knocks your opponent off balance, slowing and ensnaring it.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Wristflinger Training --
    newSkill = new Skill("Wristflinger Training", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-ranged", TargetType.Missile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your razordisk attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Gives each razordisk you fling a 5% chance/level of also ensnaring the target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Charged Shot";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fires a disk charged with magical energy. Does extra damage and sprays a powerful caustic agent on all foes near the target.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Yankshot --
    newSkill = new Skill("Yankshot", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Fires a vicious hook that damages the target and pulls it closer to you.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a 75% chance of briefly stunning the target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Netshot";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fires a fine, hooked net from your wristflinger. Damages and temporarily immobilizes your target.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == TINKERMAGE - POWER ==
    
  //// -- Blade Craft --
    newSkill = new Skill("Blade Craft", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Each level makes your melee attacks 1% more likely to hit and do 5% more damage.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
"At level 3:";
"Each additional level makes your missile attacks 1% more likely to hit and do 5% more damage.";
"At level 7, gain:";
"Improvements to your wristflinger add a 10%/level chance of riposting enemy attacks.";

  //// -- Armor Craft --
    newSkill = new Skill("Armor Craft", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Superior crafted armor gives 4%/level resistance to physical damage.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
"At level 3:";
"Adds 5%/level resistance to magic and elemental attacks.";
"At level 7, gain:";
"Each additional level adds a 5% chance to evade enemy blows.";

  //// -- Turret Craft --
    newSkill = new Skill("Turret Craft", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Each point of this skill increases the level of your turrets by one.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
"At level 3:";
"Summoned turrets appear with War Chant.";
"At level 7, gain:";
"Summoned turrets appear with Haste.";

  //// == TINKERMAGE - UTILITY ==
    
  //// -- Build Boltflinger --
    newSkill = new Skill("Build Boltflinger", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Constructs a boltflinger turret in a nearby location. It will shoot enemies. The higher this skill, the higher the level of the flinger.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Turret can also occasionally spray razors.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Build Razorflinger";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Constructs a razorflinger in a nearby location.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Build Snare Turret --
    newSkill = new Skill("Build Snare Turret", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Constructs a snare turret in a nearby location, that damages and snares nearby foes. The higher this skill, the higher the level of the turret.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Turret attack will occasionally also do more damage and weaken foes.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Build Temporal Pylon";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Constructs a temporal pylon (that damages and slows your foes) in a nearby location.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Build Blessing Pylon --
    newSkill = new Skill("Build Blessing Pylon", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Constructs a blessing pylon in a nearby location. When a foe comes close to it, it blesses nearby allies and sometimes helps their abilities to recharge faster. The higher this skill, the higher the level of the pylon.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Turret occasionally also hastes nearby allies.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Build Healing Pylon";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Constructs a healing pylon in a nearby location.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == TINKERMAGE - MASTER ==
    
  //// -- Shrapnel Grenade --
    newSkill = new Skill("Shrapnel Grenade", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Flings a lethal grenade that damages everyone near the target with vicious razors.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds a 10%/level chance of doing critical damage to the main target.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Caustic Grenade";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Flings a lethal grenade that damages everyone near the target and coats them with a vicious caustic substance.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Build Freezing Turret --
    newSkill = new Skill("Build Freezing Turret", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Constructs an ice turret in a nearby location, that sprays cones of ice on nearby foes. The higher this skill, the higher the level of the turret.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Turret occasionally sprays ice in all directions.";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Inferno Turret";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE__, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Constructs an inferno turret in a nearby location, that sprays cones of intense fire on nearby foes.";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// == TINKERMAGE - ORPHAN ==
    
  //// -- Tool Use --
    newSkill = new Skill("Tool Use", "icon-dummy", 4, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Reduces the number of lockpicks that are required whenever your group attempts to pick a lock or disarm a trap. Makes attacks against mines and turrets far more effective.";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;

  //// -- Charge Turrets --
    newSkill = new Skill("Charge Turrets", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE__);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Heals and blesses all of your existing turrets.";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Classes.Tinker.skills.push(newSkill);
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
})();
