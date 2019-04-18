package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	ctx "github.com/gophish/gophish/context"
	log "github.com/gophish/gophish/logger"
	"github.com/gophish/gophish/models"
	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
)

// Pages handles requests for the /api/tracked_attachments/ endpoint
func (as *Server) TrackedAttachments(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == "GET":
		ta, err := models.GetTrackedAttachments(ctx.Get(r, "user_id").(int64))
		if err != nil {
			log.Error(err)
		}
		JSONResponse(w, ta, http.StatusOK)
	//POST: Create a new tracked and return it as JSON
	case r.Method == "POST":
		ta := models.TrackedAttachment{}
		// Put the request into a tracked
		err := json.NewDecoder(r.Body).Decode(&ta)
		if err != nil {
			JSONResponse(w, models.Response{Success: false, Message: "Invalid request"}, http.StatusBadRequest)
			return
		}
		// Check to make sure the name is unique
		_, err = models.GetTrackedAttachmentByName(ta.Name, ctx.Get(r, "user_id").(int64))
		if err != gorm.ErrRecordNotFound {
			JSONResponse(w, models.Response{Success: false, Message: "Tracked Attachment name already in use"}, http.StatusConflict)
			log.Error(err)
			return
		}
		ta.ModifiedDate = time.Now().UTC()
		ta.UserId = ctx.Get(r, "user_id").(int64)
		err = models.PostTrackedAttachment(&ta)
		if err != nil {
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusInternalServerError)
			return
		}
		JSONResponse(w, ta, http.StatusCreated)
	}
}

// Page contains functions to handle the GET'ing, DELETE'ing, and PUT'ing
// of a Page object
func (as *Server) TrackedAttachment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.ParseInt(vars["id"], 0, 64)
	ta, err := models.GetTrackedAttachment(id, ctx.Get(r, "user_id").(int64))
	if err != nil {
		JSONResponse(w, models.Response{Success: false, Message: "Tracked Attachment not found"}, http.StatusNotFound)
		return
	}
	switch {
	case r.Method == "GET":
		JSONResponse(w, ta, http.StatusOK)
	case r.Method == "DELETE":
		err = models.DeleteTrackedAttachment(id, ctx.Get(r, "user_id").(int64))
		if err != nil {
			JSONResponse(w, models.Response{Success: false, Message: "Error deleting Tracked Attachment"}, http.StatusInternalServerError)
			return
		}
		JSONResponse(w, models.Response{Success: true, Message: "Tracked Attachment Deleted Successfully"}, http.StatusOK)
	case r.Method == "PUT":
		ta = models.TrackedAttachment{}
		err = json.NewDecoder(r.Body).Decode(&ta)
		if err != nil {
			log.Error(err)
		}
		if ta.Id != id {
			JSONResponse(w, models.Response{Success: false, Message: "/:id and /:tracked_attachment_id mismatch"}, http.StatusBadRequest)
			return
		}
		ta.ModifiedDate = time.Now().UTC()
		ta.UserId = ctx.Get(r, "user_id").(int64)
		err = models.PutTrackedAttachment(&ta)
		if err != nil {
			JSONResponse(w, models.Response{Success: false, Message: "Error updating Tracked Attachment: " + err.Error()}, http.StatusInternalServerError)
			return
		}
		JSONResponse(w, ta, http.StatusOK)
	}
}
