
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  ecAccount: '0x21B5A93d1A3e9cC856E15D2F88bd0E32920dbDFE',
  CandidatesCount:0,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var isElectionStarted;
    var loader = $("#loader");
    var content = $("#content");
    var AddCand = $("#AddCandidate");
    
    AddCand.hide();
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        console.log("Account "+App.account);
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
    
      return electionInstance.isElectionStarted();
    }).then(function(ElectionData){
      isElectionStarted = ElectionData;
      console.log("Election Started: "+isElectionStarted);
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      App.CandidatesCount = candidatesCount;
      var candidatesSelect = $('#candidatesSelect');
      var candidatesResults = $('#candidatesResults');
      candidatesSelect.empty();
      candidatesResults.empty();


      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          //var candidateTemplate = '<tr><td>' + id + '</td><td>' + name + '</td><td>' + voteCount + '</td></tr>';
          //$('candidatesResults').append(candidateTemplate);

          var tr = document.createElement('tr');   
          var td1 = document.createElement('td');
          var td2 = document.createElement('td');
          var td3 = document.createElement('td');

          var textSummary1 = document.createTextNode(id);
          var textSummary2 = document.createTextNode(name);
          var textSummary3 = document.createTextNode(voteCount);

          td1.appendChild(textSummary1);
          td2.appendChild(textSummary2);
          td3.appendChild(textSummary3);

          tr.appendChild(td1);
          tr.appendChild(td2);
          tr.appendChild(td3);

          candidatesResults.append(tr);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }

      loader.hide();
      content.show();
      $('#ElectionControl').hide();

      if(App.ecAccount.toUpperCase()  === App.account.toUpperCase()){
        console.log("Election Council account "+App.ecAccount);
        AddCand.show();
        $('#VotingForm').hide();
        $('#ElectionControl').show();
        if(isElectionStarted){
          $('#startElection').hide();
          $('#stopElection').show();
          AddCand.hide();  
        }else{
          $('#startElection').show();
          $('#stopElection').hide();  
        }
      }else{
        $('#CandidateTable').hide();
        if(!isElectionStarted){
          console.log("You are too early, Election didn't start!");
          content.hide();
          $("#loaderText").text("You are too early, Election didn't start!");
          loader.show();
        }
      }

    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  addCandidate: function(){
    var candName = $('#CandidateName').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(candName, { from: App.account });
    }).then(function(result) {
      $('#candidatesResults').empty();
      $('#CandidateName').val("");
      App.init();
    }).catch(function(err) {
      console.error(err);
    });
  },
  
  startElections: function(){
    console.log("Starting Elections");
    if(App.CandidatesCount >= 2){
      App.contracts.Election.deployed().then(function(instance) {
        instance.ElectionControl(true),{from: App.account};
      }).then(function(result){
          App.init();
      }).catch(function(err){
        console.log(err);
      });
    }
    else
      window.alert("Invalid Participating candidates");
  },
  stopElections: function(){
    console.log("Stopping Elections");
    App.contracts.Election.deployed().then(function(instance) {
      instance.ElectionControl(false),{from: App.account};
      }).then(function(result){
          App.init();
      }).catch(function(err){
        console.log(err);
      });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
