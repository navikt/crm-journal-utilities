//create person record. 
Person__c person = new Person__c();
Integer randNum = Math.round((Math.random() * (90000) + 10000));
        person.Name = ('666666' + randNum).left(11);
        person.INT_fnr__c = person.Name;
        person.INT_ActorId__c = ('88888888' + randNum).left(11);
        person.INT_FirstName__c = 'Firstname' + randNum;
        person.INT_MiddleName__c = 'Middlename' + randNum;
        person.INT_LastName__c = 'Lastname' + randNum;
        person.INT_Confidential__c = 'UGRADERT';
        person.INT_MunicipalityNumber__c = '1911';
        person.INT_RegionNumber__c = '19';
        person.INT_IsDeceased__c = false;
insert person;
