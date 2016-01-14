function Score() {

}

Score.prototype = {
  curScore: 0,
  curMultiplier: 1,
  curHealth: 100,
  curAcc: 0,
  curTotNotes: 0,
  curCombo: 300,
  newCombo: function() {
    this.curCombo = 300;
  },
  tick: function(amount) {
    this.curHealth = Math.max(0, this.curHealth - amount);
  },
  addNote: function(acc) {
    switch (acc) {
      case 300:
        this.curMultiplier++;
        this.curScore += this.curMultiplier * 300;
        this.curAcc = (this.curAcc * this.curTotNotes + 1) / (this.curTotNotes + 1);
        this.curHealth = Math.min(100, this.curHealth + 8);
        break;
      case 100:
        if (this.curCombo > 100) {
          this.curCombo = 100;
        }
        this.curMultiplier++;
        this.curScore += this.curMultiplier * 100;
        this.curAcc = (this.curAcc * this.curTotNotes + 1/3) / (this.curTotNotes + 1);
        this.curHealth = Math.min(100, this.curHealth + 6);
        break;
      case 50:
        if (this.curCombo > 0) this.curCombo == 0;
        this.curMultiplier++;
        this.curScore += this.curMultiplier * 50;
        this.curAcc = (this.curAcc * this.curTotNotes + 1/6) / (this.curTotNotes + 1);
        this.curHealth = Math.min(100, this.curHealth + 5);
        break;
      default:
        if (this.curCombo > 0) this.curCombo == 0;
        this.curMultiplier = 1;
        this.curAcc = this.curAcc * (this.curTotNotes / (this.curTotNotes + 1));
        this.curHealth -= 5;
    }
    this.curTotNotes++;
  },
};
