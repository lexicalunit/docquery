let assert = require("assert")
let touch = require("touch")
let DocQuery = require("../lib/DocQuery")
let fs = require("fs")
let delay = function(fn) {
  setTimeout(fn, 205)
}

// Ensure there is a file with a recent timestamp for sorting tests.
touch.sync(`${__dirname}/fixtures/top-5/movies.md`)

describe("DocQuery", ()=>{
  var dq
  var tempFilePath = `${__dirname}/fixtures/tempfile.md`
  var tempSubDirFilePath = `${__dirname}/fixtures/top-5/foo.md`

  beforeEach(()=>{
    dq = new DocQuery(`${__dirname}/fixtures`, {recursive: true})
  })

  afterEach(()=>{
    if(fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
    if(fs.existsSync(tempSubDirFilePath)) fs.unlinkSync(tempSubDirFilePath)
    dq.watcher.close()
    dq = null
  })

  describe("#search", ()=>{
    it("returns search result for query", (done)=>{
      dq.on("ready", function() {
        dq.search("cheeseburger", function(docs) {
          assert.equal(1, docs.length)
          var doc = docs[0]
          assert.equal(`${__dirname}/fixtures/top-5/burgers.md`, doc.filePath)
          assert.equal("burgers.md", doc.fileName)
          assert.equal("burgers", doc.title)
          assert.equal(true, doc.body.length > 0)
          dq.close(function(err) {
            if(err) assert.equal(true, false)
            done()
          })
        })
      })
    })

    it("returns new documents in search results", (done)=>{
      dq.on("ready", function() {
        dq.on("added", function(fileDetails) {
          dq.search("temp", function(docs) {
            assert.equal(1, docs.length)
            var doc = docs[0]
            assert.equal(`${__dirname}/fixtures/tempfile.md`, doc.filePath)
            assert.equal("tempfile.md", doc.fileName)
            assert.equal("tempfile", doc.title)
            assert.equal("temp file", doc.body)
            dq.close(function(err) {
              if(err) assert.equal(true, false)
              done()
            })
          })
        })
        fs.writeFileSync(tempFilePath, "temp file")
      })
    })

    it("does not return document in search results after it has been deleted", (done)=>{
      dq.on("ready", function() {
        dq.search("temp", function(docs) {
          console.log(docs)
          assert.equal(0, docs.length)
          dq.on("added", function(fileDetails) {
            dq.search("temp", function(docs) {
              assert.equal(1, docs.length)
              dq.on("removed", function(fileDetails) {
                dq.search("temp", function(docs) {
                  assert.equal(0, docs.length)
                  dq.close(function(err) {
                    if(err) assert.equal(true, false)
                    done()
                  })
                })
              })
              fs.unlinkSync(tempFilePath)
            })
          })
          fs.writeFileSync(tempFilePath, "hello world")
        })
      })
    })
  })

  describe("#documents", ()=>{
    it("returns all documents", (done)=>{
      dq.on("ready", function() {
        assert.equal(4, dq.documents.length)
        dq.close(function(err) {
          if(err) assert.equal(true, false)
          done()
        })
      })
    })

    it("returns documents sorted newest first", (done)=>{
      dq.on("ready", function() {
        assert.equal(true, dq.documents[0].modifiedAt > dq.documents[3].modifiedAt)
        dq.close(function(err) {
          if(err) assert.equal(true, false)
          done()
        })
      })
    })

    it("returns new documents as they are added", (done)=>{
      dq.on("ready", function() {
        assert.equal(4, dq.documents.length)
        dq.on("added", function(fileDetails) {
          assert.equal(5, dq.documents.length)
          dq.close(function(err) {
            if(err) assert.equal(true, false)
            done()
          })
        })
        fs.writeFileSync(tempFilePath, "hello world")
      })
    })

    it("does not return document after it has been deleted", (done)=>{
      dq.on("ready", function() {
        assert.equal("movies", dq.documents[0].title)
        done()
        dq.on("added", function(fileDetails) {
          assert.equal("tempfile", dq.documents[0].title)
          done()
          dq.on("removed", function(fileDetails) {
            assert.equal("movies", dq.documents[0].title)
            done()
            dq.close(function(err) {
              if(err) assert.equal(true, false)
              done()
            })
          })
          fs.unlinkSync(tempFilePath)
        })
        fs.writeFileSync(tempFilePath, "hello world")
      })
    })

    // it("ignores files in subfolders when recursive is false", (done)=>{
    //   var dqNR = new DocQuery(`${__dirname}/fixtures`, {recursive: false})
    //   dqNR.on("ready", function() {
    //     assert.equal(2, dqNR.documents.length)
    //     done()
    //     fs.writeFileSync(tempSubDirFilePath, "hello world")
    //     delay(()=>{
    //       assert.equal(2, dqNR.documents.length)
    //       done()
    //       dq.close(function(err) {
    //         if(err) assert.equal(true, false)
    //         done()
    //       })
    //     })
    //   })
    // })
  })

  describe("Benchmarks", function() {
    // this.timeout(0)
    //
    // beforeEach(()=>{
    //   dq = new DocQuery(`${__dirname}/benchmark/corpus`, {recursive: false})
    // })
    //
    // it("starts up in less than 5 seconds", (done)=>{
    //   dq.on("ready", function() {
    //     assert.equal(1, 1)
    //     dq.close(function(err) {
    //       if(err) assert.equal(true, false)
    //       done()
    //     })
    //   })
    // })
    //
    // it("returns search results in less than 5 seconds", (done)=>{
    //   dq.on("ready", function() {
    //     var timestamp = new Date()
    //     var docs = dq.search("star")
    //     assert.equal(106, docs.length)
    //     done()
    //   })
    // })
  })
})
